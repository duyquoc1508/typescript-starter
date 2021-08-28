## Useful configurations & scripts
### Cold reloading
Cold reloading is nice for local development. In order to do this, we'll need to rely on a couple more packages: ts-node for running TypeScript code directly without having to wait for it be compiled, and nodemon, to watch for changes to our code and automatically restart when a file is changed.
```
npm install --save-dev ts-node nodemon
```

### Creating production builds

In order to clean and compile the project for production, we can add a build script.

Install rimraf, a cross-platform tool that acts like the rm -rf command (just obliterates whatever you tell it to).
```
npm install --save-dev rimraf
```
And then, add this to your package.json.
```
"build": "rimraf ./build && tsc",
```
Now, when we run npm run build, rimraf will remove our old build folder before the TypeScript compiler emits new code to dist.

## Production startup script
In order to start the app in production, all we need to do is run the build command first, and then execute the compiled JavaScript at build/index.js.

The startup script looks like this.
```
"start": "npm run build && node build/index.js"
```

## Scripts overview
```
npm run dev
```
Starts the application in development using nodemon and ts-node to do cold reloading.
```
npm run build
```
Builds the app at build, cleaning the folder first.
```
npm run start
```
Starts the app in production by first building the project with npm run build, and then executing the compiled JavaScript at build/index.js.

# Scripts
```
npm run dev
```
Starts the application in development using nodemon and ts-node to do hot reloading.
```
npm run start
```
Starts the app in production by first building the project with npm run build, and then executing the compiled JavaScript at build/index.js.
```
npm run build
```
Builds the app at build, cleaning the folder first.
```
npm run test
```
Runs the jest tests once.

2. Create and seed the database
Seed the database with the sample data in prisma/seed.ts by running the following command:
```
npx prisma db seed --preview-feature
```