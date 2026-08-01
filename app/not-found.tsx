import Link from "next/link";
import { ArrowIcon } from "./components/Icons";

export default function NotFound() {
  return (
    <main id="main-content" className="sb-not-found">
      <div className="sb-shell">
        <span>404 / PAGE NOT FOUND</span>
        <h1>این مسیر در کاتالوگ سپید نیست.</h1>
        <p>ممکن است آدرس تغییر کرده باشد. از فروشگاه یا جستجو ادامه دهید.</p>
        <Link className="sb-btn sb-btn--dark" href="/shop">
          بازگشت به فروشگاه
          <ArrowIcon />
        </Link>
      </div>
    </main>
  );
}

