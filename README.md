
<h1 align="center">
  <br>
  <img src="https://raw.githubusercontent.com/nimblets/cloudmath/main/public/logo.png" alt="cloudmath" width="200"></a>
  <br>
  cloudmath
  <br>
</h1>

<h4 align="center">A minimal self hosted math editor app.</h4>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#how-to-use">How To Use</a> •
  <a href="#credits">Credits</a> •
  <a href="#license">License</a>
</p>

![screenshot](https://raw.githubusercontent.com/nimblets/cloudmath/main/public/example.gif)

## Key Features

* Preview - Make changes, See changes
  - Instantly see what your math document looks like in HTML as you create it.
* Syntax highlighting
* [KaTeX](https://khan.github.io/KaTeX/) Support, tikz & pgfplots graphs
* Dark/Light mode
* Toolbar for basic math notation
* Supports multiple cursors
* Save the math preview as PDF
* calculator with quick insert
* tiling window system
* keyboard centric
* cloud based 
  - monaco ide

## How To Use

To clone and run this application, you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
$ git clone https://github.com/nimblets/cloudmath

# Go into the repository
$ cd cloudmath

# Install dependencies
$ npm install

# Run the local host app
$ npm run dev
```

if you want to use the pgfplots and tikz graph generation, youll need to start the backend. 

```bash
# change to backend directory
$ cd cdloudmath/backend

# Install dependencies
$ npm install

# Run the server
$ npm start
```

## Credits

This software uses the following packages:

- [Node.js](https://nodejs.org/)
- Vite
- TypeScript
- React
- shadcn-ui 
- Tailwind CSS

## License & Branding

This project is licensed under the [Apache License 2.0](./LICENSE).

Please note:
- The name **“Cloud Math”** and its associated logos, domains, and branding
  may not be used to promote or distribute modified versions of the software
  without prior written permission from the original author.
- Forks or public re-releases should use a different name or branding.
- You are free to self-host Cloud Math for personal, educational, or business purposes.
- The official hosted version will be available at a seperate website soon. we are still early in development!

---
> GitHub [@nimblets](https://github.com/nimblets) &nbsp;&middot;&nbsp;
> Email us! support@cloudmath.mmmserv.download

