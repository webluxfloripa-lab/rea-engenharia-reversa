'use client';
import {useEffect,useRef} from 'react';
import {EditorView,keymap,lineNumbers,highlightActiveLine,drawSelection} from '@codemirror/view';
import {EditorState} from '@codemirror/state';
import {javascript} from '@codemirror/lang-javascript';
import {defaultKeymap,history,historyKeymap,indentWithTab} from '@codemirror/commands';
import {searchKeymap,highlightSelectionMatches} from '@codemirror/search';
import {autocompletion} from '@codemirror/autocomplete';
import {oneDark} from '@codemirror/theme-one-dark';
export default function CodeEditor({value,onChange,readOnly=false,fileKey}:{value:string,onChange:(v:string)=>void,readOnly?:boolean,fileKey:string}){
 const host=useRef<HTMLDivElement>(null),editor=useRef<EditorView|null>(null),cb=useRef(onChange);cb.current=onChange;
 useEffect(()=>{if(!host.current)return;const view=new EditorView({parent:host.current,state:EditorState.create({doc:value,extensions:[lineNumbers(),highlightActiveLine(),drawSelection(),history(),javascript({typescript:true,jsx:true}),oneDark,autocompletion(),highlightSelectionMatches(),keymap.of([...defaultKeymap,...historyKeymap,...searchKeymap,indentWithTab]),EditorView.lineWrapping,EditorState.readOnly.of(readOnly),EditorView.contentAttributes.of({'aria-label':'Editor de código','spellcheck':'false','autocapitalize':'off'}),EditorView.theme({'&':{height:'100%',fontSize:'14px',backgroundColor:'#10151b'},'.cm-scroller':{overflow:'auto',fontFamily:'ui-monospace, SFMono-Regular, Consolas, monospace'},'.cm-gutters':{backgroundColor:'#10151b',color:'#54616f',border:'none'},'.cm-content':{padding:'22px 0'},'.cm-line':{padding:'0 18px'},'&.cm-focused':{outline:'none'}}),EditorView.updateListener.of(u=>{if(u.docChanged)cb.current(u.state.doc.toString());})]})});editor.current=view;return()=>{view.destroy();editor.current=null;};},[fileKey,readOnly]);
 useEffect(()=>{const e=editor.current;if(e&&e.state.doc.toString()!==value)e.dispatch({changes:{from:0,to:e.state.doc.length,insert:value}});},[value]);
 return <div ref={host} className="cm-host"/>;
}
