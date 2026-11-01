// 01.11.2026: стару адресу «Правопис для дітей» назавжди переведено в розділ «Учням» (вага сторінки в Google переходить).
import { permanentRedirect } from 'next/navigation'
export default function DityRedirect() { permanentRedirect('/pravopys/uchnyam') }
