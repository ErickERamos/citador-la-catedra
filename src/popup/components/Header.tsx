import { Logo } from "./Logo";

export default function Header() {
  return (
    <header className="bg-bg-off-white px-4 py-3">
      <div className="flex items-center gap-2">
        <Logo className="h-8 text-primary-blue" />
<span className="text-primary-blue text-md font-brand font-bold italic tracking-wider ml-1 border-b-4 border-action-cyan h-[25px]">
          Citador
        </span>
      </div>
      <div className="h-[2px] bg-action-cyan mt-2 rounded-full" /> 
    </header>
  );
}
