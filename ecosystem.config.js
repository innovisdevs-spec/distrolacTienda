module.exports = {
  apps: [
    {
      name: "tienda-form-back",
      cwd: "/home/Distrolac/distrolacTienda/server",
      script: "src/index.js",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      time: true,
      env: {
        NODE_ENV: "production",
        PORT: 4100,
      },
    },
  ],
};
