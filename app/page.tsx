import { ArrowUpRight, Code2, Mail, ShieldCheck } from "lucide-react";
import { experience, profile, projects } from "../content/portfolio";
const repo = (name: string) => `${profile.github}/${name}`;
export default function Home() {
  return <main><nav><a className="wordmark" href="#top">LR</a><div><a href="#work">Work</a><a href="#experience">Experience</a><a href={`mailto:${profile.email}`}>Contact</a></div></nav>
    <section id="top" className="hero"><p className="eyebrow">DATA · ML · AI PLATFORM</p><h1>Systems that hold up when someone asks how they work.</h1><p className="lede">{profile.summary} More than twelve years across software, data engineering, machine learning, and cloud delivery.</p><div className="actions"><a className="button primary" href="#work">View selected work <ArrowUpRight size={17}/></a><a className="button" href={profile.github}>GitHub <Code2 size={17}/></a></div></section>
    <section id="work"><header><p className="eyebrow">SELECTED WORK</p><h2>Public evidence, not a tool list.</h2></header><div className="grid">{projects.map(([title, detail, slug], index) => <a className="project" key={slug} href={repo(slug)}><span>0{index + 1}</span><h3>{title}</h3><p>{detail}</p><ArrowUpRight size={18}/></a>)}</div></section>
    <section id="experience" className="split"><header><p className="eyebrow">EXPERIENCE</p><h2>From software foundations to data and AI platforms.</h2></header><ol>{experience.map(([period, title, detail]) => <li key={period}><p>{period}</p><h3>{title}</h3><span>{detail}</span></li>)}</ol></section>
    <section className="principles"><ShieldCheck size={26}/><div><p className="eyebrow">WORKING PRINCIPLES</p><h2>Clear contracts. Measured behavior. Public boundaries.</h2><p>I use reproducible data releases, explicit evaluation, infrastructure-as-code, and documented limits to make technical work reviewable.</p></div></section>
    <footer><div><strong>{profile.name}</strong><span>{profile.role}</span></div><a href={`mailto:${profile.email}`}>Start a conversation <Mail size={17}/></a></footer>
  </main>;
}
