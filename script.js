const tabs=document.querySelectorAll(".tab")
const panels=document.querySelectorAll(".tab-panel")

tabs.forEach(tab=>{
tab.onclick=()=>{
tabs.forEach(t=>t.classList.remove("active"))
panels.forEach(p=>p.classList.remove("active"))
tab.classList.add("active")
document.getElementById(tab.dataset.tab).classList.add("active")
}
})

let pages=[]

const previewContainer=document.getElementById("previewContainer")
const totalPages=document.getElementById("totalPages")

document.getElementById("pdfInput").addEventListener("change",handleFiles)

document.getElementById("addFileBtn").onclick=()=>{
document.getElementById("pdfInput").click()
}

async function handleFiles(e){
const files=e.target.files
for(let file of files){
await processFile(file)
}
renderPages()
}

async function processFile(file){
if(file.type==="application/pdf"){
const data=await file.arrayBuffer()
const pdf=await pdfjsLib.getDocument({data}).promise

for(let i=1;i<=pdf.numPages;i++){
const page=await pdf.getPage(i)
const viewport=page.getViewport({scale:1})
const canvas=document.createElement("canvas")
const ctx=canvas.getContext("2d")

canvas.width=viewport.width
canvas.height=viewport.height

await page.render({canvasContext:ctx,viewport}).promise
pages.push(canvas)
}

}else{
const img=new Image()
img.src=URL.createObjectURL(file)
await new Promise(r=>img.onload=r)

const canvas=document.createElement("canvas")
const ctx=canvas.getContext("2d")

canvas.width=img.width
canvas.height=img.height
ctx.drawImage(img,0,0)

pages.push(canvas)
}
}

function renderPages(){
previewContainer.innerHTML=""

pages.forEach((canvas,index)=>{
const div=document.createElement("div")
div.className="page"

const num=document.createElement("p")
num.innerText="Page "+(index+1)

const controls=document.createElement("div")
controls.className="page-controls"

controls.innerHTML=`
<button onclick="moveLeft(${index})">⬅</button>
<button onclick="moveRight(${index})">➡</button>
<button onclick="addPage(${index})">➕</button>
<button onclick="replacePage(${index})">🔄</button>
<button onclick="deletePage(${index})">🗑</button>
`

div.appendChild(canvas)
div.appendChild(num)
div.appendChild(controls)

previewContainer.appendChild(div)
})

totalPages.innerText=pages.length
}

function moveLeft(i){
if(i===0)return
[pages[i],pages[i-1]]=[pages[i-1],pages[i]]
renderPages()
}

function moveRight(i){
if(i===pages.length-1)return
[pages[i],pages[i+1]]=[pages[i+1],pages[i]]
renderPages()
}

function deletePage(i){
pages.splice(i,1)
renderPages()
}

function addPage(i){
const input=document.createElement("input")
input.type="file"
input.accept=".jpg,.png,.webp,.pdf"

input.onchange=async e=>{
const file=e.target.files[0]
const img=new Image()
img.src=URL.createObjectURL(file)
await new Promise(r=>img.onload=r)

const canvas=document.createElement("canvas")
const ctx=canvas.getContext("2d")
canvas.width=img.width
canvas.height=img.height
ctx.drawImage(img,0,0)

pages.splice(i+1,0,canvas)
renderPages()
}
input.click()
}

function replacePage(i){
const input=document.createElement("input")
input.type="file"
input.accept=".jpg,.png,.webp,.pdf"

input.onchange=async e=>{
const file=e.target.files[0]
const img=new Image()
img.src=URL.createObjectURL(file)
await new Promise(r=>img.onload=r)

const canvas=document.createElement("canvas")
const ctx=canvas.getContext("2d")
canvas.width=img.width
canvas.height=img.height
ctx.drawImage(img,0,0)

pages[i]=canvas
renderPages()
}
input.click()
}

document.getElementById("convertPDF").onclick=async()=>{
const pdfDoc=await PDFLib.PDFDocument.create()

for(let canvas of pages){
const img=await pdfDoc.embedPng(canvas.toDataURL())
const page=pdfDoc.addPage([canvas.width,canvas.height])
page.drawImage(img)
}

const pdfBytes=await pdfDoc.save()
const blob=new Blob([pdfBytes],{type:"application/pdf"})
const link=document.createElement("a")

link.href=URL.createObjectURL(blob)
link.download="converted.pdf"
link.click()
}
