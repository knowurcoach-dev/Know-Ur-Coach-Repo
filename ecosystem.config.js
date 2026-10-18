module.exports = {
  apps: [
    {
      name: 'knowurcoach',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 2, // 1 worker per CPU core on a 2 vCPU server
      exec_mode: 'cluster',
      max_memory_restart: '1500M', // Auto-restart if a worker exceeds 1.5GB to protect 4GB total RAM
      node_args: '--max-old-space-size=1536',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
