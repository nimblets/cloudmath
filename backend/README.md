#  LaTeX Renderer Backend 

A friendly little backend server that magically turns **any LaTeX snippet** into beautiful **SVGs**! ✨

##  Setup

1. **Install dependencies**

```bash
cd backend
npm install
```

2. **Start the server**

```bash
npm start
```

> Your server will now be happily running at:
> `http://localhost:3001` 🎉

## 🚀 Development

Want the server to watch your changes and auto-restart?

```bash
npm run dev
```

> Perfect for tinkering with **TikZ**, **boxes**, **colors**, or any LaTeX fragments! 🖌️

## 💖 Notes

* No caching
* No shell escapes, temp files cleaned up automatically. 🛡️
* Send just **fragments** or full documents can handle both! 📝
* If the frontend doesn’t know it, backend will render it. 🎨
