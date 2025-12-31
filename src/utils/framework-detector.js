const fs = require("fs");
const path = require("path");
const fileExists = (fileName) => {
  return fs.existsSync(path.join(process.cwd(), fileName));
};
const readPackageJson = () => {
  if (!fileExists("package.json")) {
    return null;
  }
  try {
    const pkgPath = path.join(process.cwd(), "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    return { ...pkg.dependencies, ...pkg.devDependencies };
  } catch (e) {
    return null;
  }
};
const FRAMEWORKS = [
  { name: "Next.js", check: () => fileExists("next.config.js") },
  { name: "Nuxt.js", check: () => fileExists("nuxt.config.js") },
  { name: "Gatsby", check: () => fileExists("gatsby-config.js") },
  { name: "SvelteKit", check: () => fileExists("svelte.config.js") },
  { name: "Angular", check: () => fileExists("angular.json") },
  {
    name: "React",
    check: () => {
      const deps = readPackageJson();
      return (
        deps && (deps["react-scripts"] || (deps["react"] && deps["react-dom"]))
      );
    },
  },
  {
    name: "Vue.js",
    check: () => {
      if (fileExists("vue.config.js")) return true;
      const deps = readPackageJson();
      return deps && deps["vue"];
    },
  },
  {
    name: "Express.js",
    check: () => {
      const deps = readPackageJson();
      return deps && deps["express"];
    },
  },
  { name: "Laravel", check: () => fileExists("artisan") },
  { name: "Django", check: () => fileExists("manage.py") },
  { name: "Ruby on Rails", check: () => fileExists("config/routes.rb") },
  {
    name: "ASP.NET Core",
    check: () => {
      try {
        return fs
          .readdirSync(process.cwd())
          .some((file) => file.endsWith(".csproj"));
      } catch (e) {
        return false;
      }
    },
  },
  { name: "Flutter", check: () => fileExists("pubspec.yaml") },
];
function detectFramework() {
  for (const framework of FRAMEWORKS) {
    if (framework.check()) {
      return framework.name;
    }
  }
  return "Unknown";
}
module.exports = { detectFramework };
