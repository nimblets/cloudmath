import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import BufferProvider from "./state/BufferProvider";
import BufferPortal from "./components/editor/BufferPortal";

createRoot(document.getElementById("root")!).render(
	<BufferProvider>
		<App />
		<BufferPortal />
	</BufferProvider>
);
