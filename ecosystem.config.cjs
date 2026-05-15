module.exports = {
  apps: [
    {
      name: "meeting-ai",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
