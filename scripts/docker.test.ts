import test from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { generateDockerfile } from '../src/lib/utils/docker.ts';

// Check for flag in process.argv or SKIP_CRON env var
const skipCron = process.argv.includes('--skip-cron') || process.env.SKIP_CRON === 'true';

const languages = [
	{
		name: 'Node.js',
		code: `console.log('croncode-test-node-success');`,
		expected: 'croncode-test-node-success'
	},
	{
		name: 'Python',
		code: `print('croncode-test-python-success')`,
		expected: 'croncode-test-python-success'
	},
	{
		name: 'Bash',
		code: `echo "croncode-test-bash-success"`,
		expected: 'croncode-test-bash-success'
	}
];

const cronSchedule = '* * * * *';
const tmpDir = join(process.cwd(), 'tests', 'tmp');

test('Docker Deployment Tests', async (t) => {
	console.log('Starting Docker Deployment Tests...');
	if (skipCron) {
		console.log('>>> SKIP_CRON is enabled. Skipping 65s wait and cron verification.');
	}
	
	rmSync(tmpDir, { recursive: true, force: true });
	mkdirSync(tmpDir, { recursive: true });

	// Step 1: Build Docker Images
	await t.test('Build Docker Images', async (t) => {
		for (const lang of languages) {
			await t.test(`Build ${lang.name}`, () => {
				console.log(`\n--- Building ${lang.name} ---`);
				const { dockerfile, runCommand } = generateDockerfile(lang.code, lang.name, cronSchedule);
				const langDir = join(tmpDir, lang.name.toLowerCase().replace('.', ''));
				mkdirSync(langDir, { recursive: true });
				
				const dockerfilePath = join(langDir, 'Dockerfile');
				writeFileSync(dockerfilePath, dockerfile);

				const imageName = `croncode-test-${lang.name.toLowerCase().replace('.', '')}`;
				
				execSync(`docker build -t ${imageName} .`, { cwd: langDir, stdio: 'inherit' });
				
				(lang as any).runCommand = runCommand;
				(lang as any).imageName = imageName;
			});
		}
	});

	// Step 2: Immediate Execution Tests
	await t.test('Immediate Execution (Bypass Cron)', async (t) => {
		console.log('\n--- Starting Immediate Execution Tests ---');
		for (const lang of languages) {
			await t.test(`Execute ${lang.name}`, () => {
				console.log(`Running ${lang.name} immediately...`);
				const cmd = `docker run --rm ${(lang as any).imageName} ${(lang as any).runCommand}`;
				console.log(`Command: ${cmd}`);
				const output = execSync(cmd, { timeout: 10000 }).toString().trim();
				console.log(`Output: ${output}`);
				assert.ok(output.includes(lang.expected), `Expected ${lang.expected} to be in output`);
			});
		}
	});

	// Step 3: Cron Execution Tests
	if (!skipCron) {
		await t.test('Cron Execution', async (t) => {
			console.log('\n--- Starting Cron Execution Tests ---');
			const containers: string[] = [];

			for (const lang of languages) {
				const containerName = `${(lang as any).imageName}-run`;
				containers.push(containerName);
				
				try {
					execSync(`docker rm -f ${containerName}`, { stdio: 'ignore' });
				} catch (e) {}

				console.log(`Starting container for ${lang.name}: ${containerName}`);
				execSync(`docker run -d --name ${containerName} ${(lang as any).imageName}`);
			}

			console.log('\nWaiting 65 seconds for cron jobs to trigger (clock tick)...');
			await new Promise(resolve => setTimeout(resolve, 65000));

			for (let i = 0; i < languages.length; i++) {
				const lang = languages[i];
				const containerName = containers[i];

				await t.test(`Verify Cron ${lang.name}`, () => {
					console.log(`Verifying cron for ${lang.name}...`);
					try {
						const output = execSync(`docker exec ${containerName} cat /var/log/cron.log`).toString().trim();
						console.log(`Log output: ${output}`);
						assert.ok(output.includes(lang.expected), `Expected ${lang.expected} to be in cron.log`);
					} finally {
						console.log(`Cleaning up ${containerName}...`);
						execSync(`docker rm -f ${containerName}`, { stdio: 'ignore' });
					}
				});
			}
		});
	}
});
