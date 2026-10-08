module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run start",
      startServerReadyPattern: "Ready in|Local:",
      url: [
        "http://127.0.0.1:3000/",
        "http://127.0.0.1:3000/shop",
        "http://127.0.0.1:3000/brands",
        "http://127.0.0.1:3000/magazine",
      ],
      numberOfRuns: 1,
      settings: {
        chromeFlags: "--headless=new --no-sandbox",
      },
    },
    assert: {
      assertions: {
        "categories:seo": ["error", { minScore: 0.95 }],
        "categories:accessibility": ["warn", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:performance": ["warn", { minScore: 0.75 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
