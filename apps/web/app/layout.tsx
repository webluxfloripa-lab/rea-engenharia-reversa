import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'REA Studio — Entenda o que existe. Crie o que vem depois.',description:'Laboratório visual de investigação de software. Código autorizado, evidências rastreáveis e um workspace feito para explorar.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>;}
