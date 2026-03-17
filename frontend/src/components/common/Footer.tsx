export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200  py-10 bg-white ">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3 text-primary opacity-80 mix-blend-luminosity ">
          <span className="material-symbols-outlined text-2xl">explore</span>
          <h2 className="text-slate-900  text-lg font-bold">WebTravel</h2>
        </div>
        <div className="flex gap-8 text-sm font-medium text-slate-500">
          <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
          <a className="hover:text-primary transition-colors" href="#">Support</a>
        </div>
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} WebTravel Inc. All rights reserved.</p>
      </div>
    </footer>
  );
}
