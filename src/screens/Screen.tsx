import { ComponentChildren } from "preact"
import back from "@/assets/icons/back.svg"

export interface ScreenProps {
    children?: ComponentChildren;
    title?: string | null;
    onClose?: () => unknown;
}

export default function Screen({ children, title, onClose }: ScreenProps) {
    return (
        <div className="screen">
            <div className="flex">
                <img className="icon button" src={back} onMouseUp={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    onClose && onClose();
                }} />
                {title && <h1>{title}</h1>}
            </div>
            {children}
        </div>
    )
}