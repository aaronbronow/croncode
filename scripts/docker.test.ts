import test from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { generateDockerfile } from '../src/lib/utils/docker.ts';

// Check for flags in process.argv or env vars
const skipCron = process.argv.includes('--skip-cron') || process.env.SKIP_CRON === 'true';
const offlineMode = process.argv.includes('--offline') || process.env.OFFLINE_MODE === 'true';

const networkFlag = offlineMode ? '--network none' : '--network host';

const languages = [
	{
		name: 'Node.js Hello World',
		expected: 'hello world',
		dockerfileName: 'Dockerfile.hello-world',
		isPreExisting: true,
		sourceDir: 'nodejs',
		runCommand: 'node /app/script.js'
	},
	{
		name: 'Node.js Hacker News',
		expected: 'Latest Hacker News Headlines:',
		dockerfileName: 'Dockerfile.hacker-news',
		isPreExisting: true,
		sourceDir: 'nodejs',
		runCommand: 'node /app/script.js'
	},
	{
		name: 'Python Hello World',
		expected: 'hello world',
		dockerfileName: 'Dockerfile.hello-world',
		isPreExisting: true,
		sourceDir: 'python',
		runCommand: 'python3 /app/script.py'
	},
	{
		name: 'Python Hacker News',
		expected: 'Latest Hacker News Headlines:',
		dockerfileName: 'Dockerfile.hacker-news',
		isPreExisting: true,
		sourceDir: 'python',
		runCommand: 'python3 /app/script.py'
	},
	{
		name: 'Bash Hello World',
		expected: 'hello world',
		dockerfileName: 'Dockerfile.hello-world',
		isPreExisting: true,
		sourceDir: 'bash',
		runCommand: 'sh /app/script.sh'
	},
	{
		name: 'Bash Hacker News',
		expected: 'Fetching latest Hacker News headlines...',
		dockerfileName: 'Dockerfile.hacker-news',
		isPreExisting: true,
		sourceDir: 'bash',
		runCommand: 'sh /app/script.sh',
		skip: true // Requires apk add curl jq which fails in network-restricted build
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
			if ((lang as any).skip) continue;
			await t.test(`Build ${lang.name}`, () => {
				console.log(`\n--- Building ${lang.name} ---`);
				const langDir = join(tmpDir, lang.name.toLowerCase().replace(/[ .]/g, ''));
				mkdirSync(langDir, { recursive: true });
				
				if (!(lang as any).isPreExisting) {
					const { dockerfile, runCommand } = generateDockerfile(lang.code!, lang.name, cronSchedule);
					const dockerfilePath = join(langDir, lang.dockerfileName);
					writeFileSync(dockerfilePath, dockerfile);
					(lang as any).runCommand = runCommand;
				} else {
					// Copy pre-existing Dockerfile from tests/<sourceDir>/
					const srcPath = join(process.cwd(), 'tests', (lang as any).sourceDir, lang.dockerfileName);
					const destPath = join(langDir, lang.dockerfileName);
					execSync(`cp ${srcPath} ${destPath}`);
				}

				const imageName = `croncode-test-${lang.name.toLowerCase().replace(/[ .]/g, '')}`;

				execSync(`docker build -t ${imageName} ${networkFlag} -f ${lang.dockerfileName} .`, {
					cwd: langDir,
					stdio: 'inherit'
				});

				(lang as any).imageName = imageName;
			});
		}
	});

	// Step 2: Immediate Execution Tests
	await t.test('Immediate Execution (Bypass Cron)', async (t) => {
		console.log('\n--- Starting Immediate Execution Tests ---');
		for (const lang of languages) {
			if ((lang as any).skip) continue;
			await t.test(`Execute ${lang.name}`, () => {
				console.log(`Running ${lang.name} immediately...`);
				const cmd = `docker run --rm ${networkFlag} ${(lang as any).imageName} ${(lang as any).runCommand}`;
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
				if ((lang as any).skip) continue;
				const containerName = `${(lang as any).imageName}-run`;
				containers.push(containerName);

				try {
					execSync(`docker rm -f ${containerName}`, { stdio: 'ignore' });
				} catch (e) {}

				console.log(`Starting container for ${lang.name}: ${containerName}`);
				execSync(`docker run -d ${networkFlag} --name ${containerName} ${(lang as any).imageName}`);
			}

			console.log('\nWaiting 65 seconds for cron jobs to trigger (clock tick)...');
			await new Promise((resolve) => setTimeout(resolve, 65000));

			const activeLangs = languages.filter(l => !(l as any).skip);
			for (let i = 0; i < activeLangs.length; i++) {
				const lang = activeLangs[i];
				const containerName = containers[i];

				await t.test(`Verify Cron ${lang.name}`, () => {
					console.log(`Verifying cron for ${lang.name}...`);
					try {
						const output = execSync(`docker exec ${containerName} cat /var/log/cron.log`)
							.toString()
							.trim();
						console.log(`Log output: ${output}`);
						assert.ok(
							output.includes(lang.expected),
							`Expected ${lang.expected} to be in cron.log`
						);
					} finally {
						console.log(`Cleaning up ${containerName}...`);
						execSync(`docker rm -f ${containerName}`, { stdio: 'ignore' });
					}
				});
			}
		});
	}
});
