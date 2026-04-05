export interface DockerConfig {
	dockerfile: string;
	runCommand: string;
}

export function generateDockerfile(code: string, language: string, cron: string): DockerConfig {
	let baseImage = '';
	let scriptFilename = '';
	let runCommand = '';

	switch (language) {
		case 'Node.js':
			baseImage = 'node:20-alpine';
			scriptFilename = 'script.js';
			runCommand = 'node /app/script.js';
			break;
		case 'Python':
			baseImage = 'python:3.11-alpine';
			scriptFilename = 'script.py';
			runCommand = 'python3 /app/script.py';
			break;
		case 'Bash':
			baseImage = 'alpine:3.18';
			scriptFilename = 'script.sh';
			runCommand = 'sh /app/script.sh';
			break;
		default:
			baseImage = 'node:20-alpine';
			scriptFilename = 'script.js';
			runCommand = 'node /app/script.js';
	}

	const dockerfile = `FROM ${baseImage}

# Alpine images include crond (busybox) by default. 
# No extra package installation needed, maximizing portability.

WORKDIR /app

# Create the script file
RUN cat <<'EOF' > /app/${scriptFilename}
${code}
EOF

# Create the entrypoint script
RUN cat <<'EOF' > /usr/local/bin/run.sh
#!/bin/sh

# Export environment variables for cron
env | grep -v 'HOME' | grep -v 'PWD' | grep -v 'PATH' | grep -v 'SHLVL' > /etc/environment

# If arguments are provided, execute them directly (bypass cron)
if [ $# -gt 0 ]; then
    exec "$@"
fi

# Setup crontab (Alpine Busybox path)
mkdir -p /var/spool/cron/crontabs
echo "${cron} ${runCommand} >> /var/log/cron.log 2>&1" > /var/spool/cron/crontabs/root

# Ensure permissions
chmod 0600 /var/spool/cron/crontabs/root
touch /var/log/cron.log

# Run cron in foreground
echo "Starting cron with schedule: ${cron}"
exec crond -f -l 2
EOF

RUN chmod +x /usr/local/bin/run.sh /app/${scriptFilename}

ENTRYPOINT ["/usr/local/bin/run.sh"]
`;

	return {
		dockerfile,
		runCommand
	};
}
