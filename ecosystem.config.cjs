module.exports = {
  apps: [{
    name: 'threatradar',
    script: 'dist/server.cjs',
    cwd: '/home/deploy/apps/threatradar-osint',
    instances: 1,
    exec_mode: 'fork',
    node_args: '--max-old-space-size=256',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3013
    }
  }]
};
