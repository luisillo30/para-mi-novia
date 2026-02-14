// --- Utilidades ---
function normText(s){
  return (s ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function parseDateFlexible(s){
  // Acepta cosas tipo:
  // "16 de enero de 2025"
  // "16/01/2025" o "16-01-2025" o "16.01.2025"
  // "2025-01-16"
  const t = normText(s);

  // 1) dd/mm/yyyy (o con - o .)
  let m = t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (m){
    const dd = String(m[1]).padStart(2,"0");
    const mm = String(m[2]).padStart(2,"0");
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  // 2) yyyy-mm-dd
  m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m){
    const yyyy = m[1];
    const mm = String(m[2]).padStart(2,"0");
    const dd = String(m[3]).padStart(2,"0");
    return `${yyyy}-${mm}-${dd}`;
  }

  // 3) "16 de enero de 2025"
  const months = {
    "enero":"01","febrero":"02","marzo":"03","abril":"04","mayo":"05","junio":"06",
    "julio":"07","agosto":"08","septiembre":"09","setiembre":"09","octubre":"10","noviembre":"11","diciembre":"12"
  };
  m = t.match(/^(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+de\s+(\d{4})$/i);
  if (m){
    const dd = String(m[1]).padStart(2,"0");
    const mon = normText(m[2]).normalize("NFD").replace(/[\u0300-\u036f]/g,""); // quita acentos
    const mm = months[mon];
    const yyyy = m[3];
    if (!mm) return null;
    return `${yyyy}-${mm}-${dd}`;
  }

  return null;
}

// --- Cuestionario ---
const steps = [
  {
    type: "input",
    title: "1) ¿Cuál es nuestro aniversario?",
    help: "Ejemplos válidos: “DD/MM/AAAA”.",
    correctISO: "2025-01-16",
  },
  {
    type: "input",
    title: "2) ¿Cuál fue el día que nos empezamos a hablar?",
    help: "Ejemplos válidos: “DD/MM/AAAA”.",
    correctISO: "2024-02-14",
  },
  {
    type: "mc",
    title: "3) ¿Quién era la persona que rogaba para que saliéramos juntos?",
    choices: ["Natalia", "Damián"],
    correct: "natalia",
  },
  {
    type: "mc",
    title: "4) En el día de nuestra primera cita, ¿cuál fue el orden de las cosas?",
    choices: [
      "Inciso 1: Te dije “voltea para allá”, te jalé, te besé y te acomodaste para seguir el beso.",
      "Inciso 2: Te dije “voltea para allá”, te jalé, te besé y te me abalanzaste encima."
    ],
    correctIndex: 1, // la segunda es la correcta
  },
  {
    type: "mc",
    title: "5) ¿Cómo se va a llamar nuestro hijo?",
    choices: ["Carlos", "Mateo", "Santiago", "Diego", "Emilio", "Leonardo"],
    correct: "carlos",
  }
];

let idx = 0;
let currentAnswer = null;
let passed = false;

const stepEl = document.getElementById("step");
const msgEl = document.getElementById("msg");
const progressEl = document.getElementById("progress");
const btnCheck = document.getElementById("btnCheck");
const btnNext = document.getElementById("btnNext");

function render(){
  const s = steps[idx];
  passed = false;
  btnNext.disabled = true;
  msgEl.textContent = "";
  msgEl.className = "msg";
  currentAnswer = null;

  progressEl.textContent = `Pregunta ${idx+1} de ${steps.length}`;

  if (s.type === "input"){
    stepEl.innerHTML = `
      <h2>${s.title}</h2>
      <p>${s.help}</p>
      <label>Tu respuesta:</label>
      <input id="inp" placeholder="Escribe aquí…" autocomplete="off" />
    `;
    document.getElementById("inp").addEventListener("input", (e)=>{
      currentAnswer = e.target.value;
    });
  }

  if (s.type === "mc"){
    stepEl.innerHTML = `
      <h2>${s.title}</h2>
      <div class="choices" id="choices"></div>
    `;
    const c = document.getElementById("choices");
    s.choices.forEach((text, i)=>{
      const div = document.createElement("div");
      div.className = "choice";
      div.textContent = text;
      div.addEventListener("click", ()=>{
        [...c.children].forEach(x=>x.classList.remove("selected"));
        div.classList.add("selected");
        currentAnswer = { text, index: i };
      });
      c.appendChild(div);
    });
  }
}

function check(){
  const s = steps[idx];

  if (s.type === "input"){
    const iso = parseDateFlexible(currentAnswer);
    if (!iso){
      msgEl.textContent = "Escribe la fecha con formato válido 😅 (ej. 16/01/2025 o “16 de enero de 2025”).";
      msgEl.className = "msg bad";
      return;
    }
    if (iso === s.correctISO){
      msgEl.textContent = "Correcto 😌";
      msgEl.className = "msg ok";
      passed = true;
      btnNext.disabled = false;
    } else {
      msgEl.textContent = "Nope 😈 inténtalo otra vez.";
      msgEl.className = "msg bad";
    }
    return;
  }

  if (s.type === "mc"){
    if (!currentAnswer){
      msgEl.textContent = "Elige una opción 👀";
      msgEl.className = "msg bad";
      return;
    }

    if (typeof s.correctIndex === "number"){
      if (currentAnswer.index === s.correctIndex){
        msgEl.textContent = "Correcto 😏";
        msgEl.className = "msg ok";
        passed = true;
        btnNext.disabled = false;
      } else {
        msgEl.textContent = "Nop 😈 esa no fue.";
        msgEl.className = "msg bad";
      }
      return;
    }

    // Correct por texto
    const picked = normText(currentAnswer.text);
    if (picked === s.correct){
      msgEl.textContent = "Correcto ✅";
      msgEl.className = "msg ok";
      passed = true;
      btnNext.disabled = false;
    } else {
      msgEl.textContent = "Incorrecto 😈";
      msgEl.className = "msg bad";
    }
  }
}

btnCheck.addEventListener("click", check);

btnNext.addEventListener("click", ()=>{
  if (!passed) return;

  // Si esta es la ÚLTIMA pregunta, en lugar de avanzar, desbloquea y manda a carta.
  if (idx === steps.length - 1) {
    try { localStorage.setItem("quiz_passed", "yes"); } catch(e) {}
    window.location.href = "carta.html?ok=1";
    return;
  }

  idx++;
  render();
});


render();
