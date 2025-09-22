
// ---- Config ----
const DIMENSIONS = ["Vision de soi","Acceptation de soi","Amour de soi","Confiance en soi"];
const SCALE_LABELS = ["Pas du tout d’accord (1)","Plutôt pas d’accord (2)","Ni d’accord ni pas d’accord (3)","Plutôt d’accord (4)","Tout à fait d’accord (5)"];

// Level thresholds
function levelFor(score, max){
  const p = score / max;
  if (p < 0.45) return {label:"Fragile", color:"#dc2626"};
  if (p < 0.66) return {label:"En construction", color:"#f59e0b"};
  if (p < 0.85) return {label:"Solide", color:"#16a34a"};
  return {label:"Rayonnant", color:"#0ea5e9"};
}

// Load items
let ITEMS = [];
fetch("items.json").then(r=>r.json()).then(data => {
  ITEMS = data;
  init();
});

// State
let idx = 0;
const answers = new Array(32).fill(null);

// Elements
const qIndexEl = () => document.getElementById("q-index");
const qTextEl = () => document.getElementById("q-text");
const scaleEl = () => document.getElementById("scale");
const prevBtn = () => document.getElementById("prev");
const nextBtn = () => document.getElementById("next");
const submitBtn = () => document.getElementById("submit");
const progressEl = () => document.getElementById("progress");
const formCard = () => document.getElementById("form-card");
const resultsCard = () => document.getElementById("results-card");

function init(){
  renderQuestion();
  prevBtn().addEventListener("click", ()=>{ if(idx>0){ idx--; renderQuestion(); } });
  nextBtn().addEventListener("click", ()=>{ if(idx<ITEMS.length-1){ idx++; renderQuestion(); } });
  submitBtn().addEventListener("click", onSubmit);
}

function renderQuestion(){
  const it = ITEMS[idx];
  qIndexEl().textContent = `Question ${idx+1}/${ITEMS.length}`;
  qTextEl().textContent = it.text;

  const current = answers[idx];
  scaleEl().innerHTML = "";
  for(let v=1; v<=5; v++){
    const opt = document.createElement("div");
    opt.className = "opt" + (current===v ? " selected": "");
    opt.innerHTML = `<div>${v}</div><div class="lbl">${SCALE_LABELS[v-1]}</div>`;
    opt.addEventListener("click", ()=>{
      answers[idx] = v;
      renderQuestion();
      // Auto-advance after short delay for speed
      setTimeout(()=>{
        if(idx < ITEMS.length - 1){
          idx++; renderQuestion();
        } else {
          submitBtn().disabled = false;
          nextBtn().disabled = true;
        }
      }, 120);
    });
    scaleEl().appendChild(opt);
  }

  prevBtn().disabled = idx===0;
  nextBtn().disabled = answers[idx]===null || idx===ITEMS.length-1;
  submitBtn().disabled = answers.some(a=>a===null);
  const pct = Math.round(((idx)/ITEMS.length)*100);
  progressEl().style.width = `${pct}%`;
}

function onSubmit(){
  if(answers.some(a=>a===null)){ alert("Merci de répondre à toutes les questions."); return; }
  const scores = scoreAnswers();
  showResults(scores);
}

function scoreAnswers(){
  // Map items to dimension scores with reverse coding for reverse:true (1<->5, 2<->4)
  const byDim = { "Vision de soi":0, "Acceptation de soi":0, "Amour de soi":0, "Confiance en soi":0 };
  const counts = { "Vision de soi":0, "Acceptation de soi":0, "Amour de soi":0, "Confiance en soi":0 };
  ITEMS.forEach((it, i) => {
    let v = answers[i];
    if(it.reverse){
      v = 6 - v;
    }
    byDim[it.dim] += v;
    counts[it.dim]++;
  });
  const dimScores = DIMENSIONS.map(d => byDim[d]); // each max 40
  const total = dimScores.reduce((a,b)=>a+b,0); // max 160
  return { dimScores, total };
}

function showResults({dimScores, total}){
  formCard().style.display = "none";
  resultsCard().style.display = "block";

  // Global KPI
  const globalMax = 160;
  document.getElementById("global-score").textContent = `${total} / ${globalMax}`;
  const gLevel = levelFor(total, globalMax);
  const badge = document.getElementById("global-level");
  badge.textContent = gLevel.label;
  badge.style.background = gLevel.color;
  badge.style.color = "white";

  // Per-dimension tiles
  const grid = document.getElementById("grid");
  grid.innerHTML = "";
  DIMENSIONS.forEach((d, i) => {
    const max = 40;
    const lvl = levelFor(dimScores[i], max);
    const el = document.createElement("div");
    el.className = "section";
    el.innerHTML = `<h3>${d}</h3>
      <div class="legend">
        <span class="tag">Score : <strong>${dimScores[i]} / ${max}</strong></span>
        <span class="tag">Niveau : <strong style="color:${lvl.color}">${lvl.label}</strong></span>
      </div>
      <p>${dimensionNarrative(d, dimScores[i])}</p>
      <div><strong>Conseils clés :</strong><ul>${tipsFor(d, dimScores[i]).map(t=>`<li>${t}</li>`).join("")}</ul></div>
    `;
    grid.appendChild(el);
  });

  // Action plan (focus on 1-2 lowest dims)
  const sorted = DIMENSIONS.map((d,i)=>({d,score:dimScores[i]})).sort((a,b)=>a.score-b.score);
  const focus = sorted.slice(0,2);
  const planEl = document.getElementById("plan");
  planEl.innerHTML = `
    <div class="section">
      <h3>Plan d’action personnalisé (4 semaines)</h3>
      <p>Priorités: <strong>${focus.map(f=>f.d).join(" + ")}</strong></p>
      <ol>
        <li><strong>Rituel quotidien (5 minutes) :</strong> ${dailyRitual(focus.map(f=>f.d))}</li>
        <li><strong>Exercice hebdo :</strong> ${weeklyExercise(focus.map(f=>f.d))}</li>
        <li><strong>Défi progressif :</strong> ${challenge(focus.map(f=>f.d))}</li>
      </ol>
      <p style="color:#64748b">Astuce : imprimez ce rapport (bouton ci-dessous) et cochez vos actions chaque jour.</p>
    </div>
  `;

  // Radar
  drawRadar("radar", dimScores.map(s => s/40)); // normalize 0..1
}

function dimensionNarrative(dim, score){
  const lvl = levelFor(score, 40).label;
  const texts = {
    "Vision de soi": {
      "Fragile": "Tu as encore besoin de clarifier qui tu es et ce qui compte pour toi. Bonne nouvelle : cela se construit avec de petits choix alignés chaque semaine.",
      "En construction": "Ta vision s’affine. Continue à explorer tes valeurs, tes points forts et tes passions pour gagner en cohérence.",
      "Solide": "Tu sais où tu vas et ce que tu veux. Reste attentif(ve) aux signaux internes pour garder le cap.",
      "Rayonnant": "Vision claire et inspirante. Tu deviens un repère pour les autres. Pense à la transmettre avec humilité."
    },
    "Acceptation de soi": {
      "Fragile": "L’auto-critique te pèse. Il est temps d’apprendre à être ton meilleur allié : on progresse en s’encourageant, pas en se jugeant.",
      "En construction": "Tu fais des progrès pour accueillir tes imperfections. Continue à transformer tes erreurs en apprentissages.",
      "Solide": "Tu sais te pardonner et rebondir. Ta résilience inspire.",
      "Rayonnant": "Grande bienveillance envers toi-même : c’est une force qui sécurise ton entourage."
    },
    "Amour de soi": {
      "Fragile": "Tu t’oublies souvent. Reviens aux bases : sommeil, respiration, alimentation simple, célébration des petites victoires.",
      "En construction": "Tu commences à mieux te traiter. Quelques rituels de soin personnel feront la différence.",
      "Solide": "Tu respectes tes besoins et tu valorises tes progrès. Continue !",
      "Rayonnant": "Tu rayonnes parce que tu t’apprécies sincèrement. Tu as trouvé un ton juste avec toi-même."
    },
    "Confiance en soi": {
      "Fragile": "Le doute te freine. On va bâtir des succès progressifs pour muscler ta confiance.",
      "En construction": "Tu oses déjà un peu. Enchaînons des petites actions pour consolider cette dynamique.",
      "Solide": "Tu agis malgré l’incertitude : belle posture de croissance.",
      "Rayonnant": "Tu avances avec assurance et respect des autres. Continue à t’affirmer avec justesse."
    }
  };
  return texts[dim][lvl];
}

function tipsFor(dim, score){
  const lvl = levelFor(score, 40).label;
  const tips = {
    "Vision de soi": {
      "Fragile": [
        "Écris 5 valeurs qui te parlent et 3 choix concrets associés.",
        "Note chaque soir 1 moment où tu t’es senti(e) aligné(e).",
        "Supprime 1 comparaison inutile (réseaux sociaux)."
      ],
      "En construction": [
        "Rédige un mini-manifeste « Ce qui compte pour moi » (10 lignes).",
        "Fais un point « cap de la semaine » chaque dimanche soir.",
        "Cherche 1 mentor ou modèle inspirant."
      ],
      "Solide": [
        "Transforme ta vision en objectifs SMART-ERS sur 4 semaines.",
        "Partage ton cap à un proche (effet engagement).",
        "Réserve un créneau « réajustement » mensuel."
      ],
      "Rayonnant": [
        "Aide un pair à clarifier sa vision (effet miroir).",
        "Formalise ta vision en une page visuelle.",
        "Identifie 1 zone de challenge qui te stimule."
      ]
    },
    "Acceptation de soi": {
      "Fragile": [
        "Remplace l’auto-critique par « Comment j’apprends de ça ? ».",
        "Journal 3 lignes : échec → leçon → prochaine micro-action.",
        "Exercice respiration 4-4-6 après un raté."
      ],
      "En construction": [
        "Liste 10 imperfections que tu acceptes mieux qu’avant.",
        "Pratique « parole gentille à soi » 1 fois/jour.",
        "Demande un feedback bienveillant à un proche."
      ],
      "Solide": [
        "Enseigne ta méthode de rebond à un ami.",
        "Crée une check-list « je me pardonne » (3 étapes).",
        "Planifie un bilan trimestriel des leçons apprises."
      ],
      "Rayonnant": [
        "Anime un mini atelier d’auto-bienveillance.",
        "Écris une lettre de compassion à ton « toi » d’il y a 2 ans.",
        "Soutiens quelqu’un dans son rebond."
      ]
    },
    "Amour de soi": {
      "Fragile": [
        "Sommeil : heure fixe + 15 min d’écran en moins.",
        "Réserve 10 min/jour pour un soin simple (respiration, étirements).",
        "Célèbre 1 petite victoire par jour."
      ],
      "En construction": [
        "Bloque 2 pauses conscientes par jour (timer 3 min).",
        "Prépare 3 collations saines pour la semaine.",
        "Planifie 1 activité joie/énergie le week-end."
      ],
      "Solide": [
        "Crée une playlist ancre positive pour les moments clés.",
        "Offre-toi un rendez-vous hebdo « moi & moi ».",
        "Note 3 gratitudes quotidiennes."
      ],
      "Rayonnant": [
        "Transmets tes rituels à un proche.",
        "Organise une « soirée célébration des progrès » en équipe/famille.",
        "Ose demander de l’aide sur un sujet ambitieux."
      ]
    },
    "Confiance en soi": {
      "Fragile": [
        "Micro-défis quotidiens (2/10 d’effort).",
        "Journal de réussites (3 lignes / soir).",
        "Entraînement à dire « je » (besoin + demande)."
      ],
      "En construction": [
        "Technique « si… alors… » pour passer à l’action.",
        "Exposition graduée : 4 paliers sur 2 semaines.",
        "Prépare une réponse type aux critiques."
      ],
      "Solide": [
        "Prends la parole 1 fois/semaine en groupe.",
        "Coach un pair sur un sujet que tu maîtrises.",
        "Fixe un défi 7 jours – 7 actions."
      ],
      "Rayonnant": [
        "Partage une histoire de courage personnel.",
        "Deviens tuteur d’un plus jeune.",
        "Cible un défi « zone d’audace » (7/10)."
      ]
    }
  };
  return tips[dim][lvl];
}

function dailyRitual(focus){
  return "respiration 4-4-6 (1 min) + phrase d’auto-coaching + 1 micro-action alignée avec " + focus.join(" & ");
}
function weeklyExercise(focus){
  if(focus.includes("Vision de soi")) return "mini-manifeste (10 lignes) et feedback d’un proche";
  if(focus.includes("Acceptation de soi")) return "journal échec→leçon→action (2 fois)";
  if(focus.includes("Amour de soi")) return "routine sommeil + célébration hebdo";
  if(focus.includes("Confiance en soi")) return "exposition graduée (4 paliers)";
  return "revue hebdo des progrès (15 min)";
}
function challenge(focus){
  if(focus.includes("Confiance en soi")) return "prendre la parole 1 fois en groupe";
  if(focus.includes("Vision de soi")) return "choisir et tenir 1 cap concret 7 jours";
  if(focus.includes("Acceptation de soi")) return "oser demander un feedback bienveillant";
  if(focus.includes("Amour de soi")) return "dire « non » à 1 demande énergivore";
  return "défi 7 jours – 7 petites actions";
}

// Simple radar chart without external libs
function drawRadar(canvasId, values){ // values in [0..1], length = 4
  const c = document.getElementById(canvasId);
  const dpr = window.devicePixelRatio || 1;
  const w = c.clientWidth * dpr;
  const h = c.clientHeight * dpr;
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  const cx = w/2, cy = h/2;
  const radius = Math.min(w,h)*0.36;

  ctx.clearRect(0,0,w,h);
  ctx.lineWidth = 1*dpr;
  ctx.strokeStyle = "#94a3b8";
  ctx.fillStyle = "#94a3b8";

  // axes (4)
  for(let i=0;i<4;i++){
    const ang = -Math.PI/2 + i * (Math.PI/2);
    const x = cx + radius*Math.cos(ang);
    const y = cy + radius*Math.sin(ang);
    ctx.beginPath();
    ctx.moveTo(cx,cy); ctx.lineTo(x,y); ctx.stroke();
  }

  // grid polygons (5 rings)
  ctx.strokeStyle = "#e2e8f0";
  for(let r=0.2; r<=1.001; r+=0.2){
    ctx.beginPath();
    for(let i=0;i<4;i++){
      const ang = -Math.PI/2 + i * (Math.PI/2);
      const x = cx + radius*r*Math.cos(ang);
      const y = cy + radius*r*Math.sin(ang);
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath(); ctx.stroke();
  }

  // labels
  ctx.fillStyle = "#0f172a";
  ctx.font = `${14*dpr}px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`;
  const labels = ["Vision de soi","Acceptation de soi","Amour de soi","Confiance en soi"];
  for(let i=0;i<4;i++){
    const ang = -Math.PI/2 + i * (Math.PI/2);
    const x = cx + (radius+18*dpr)*Math.cos(ang);
    const y = cy + (radius+18*dpr)*Math.sin(ang);
    ctx.textAlign = ["center","left","center","right"][i];
    ctx.textBaseline = ["alphabetic","middle","hanging","middle"][i];
    ctx.fillText(labels[i], x, y);
  }

  // area
  ctx.beginPath();
  for(let i=0;i<4;i++){
    const ang = -Math.PI/2 + i * (Math.PI/2);
    const r = values[i]*radius;
    const x = cx + r*Math.cos(ang);
    const y = cy + r*Math.sin(ang);
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.closePath();
  ctx.fillStyle = "rgba(46,134,222,0.18)";
  ctx.strokeStyle = "#2E86DE";
  ctx.lineWidth = 2*dpr;
  ctx.fill();
  ctx.stroke();
}

// Print
document.addEventListener("click", (e)=>{
  if(e.target && e.target.id === "print"){
    window.print();
  }
});


// ---- Logo handling ----
function applyLogo(dataUrl){
  document.querySelectorAll('img[alt="Logo"]').forEach(img => { img.src = dataUrl; });
}
function loadLogo(){
  const stored = localStorage.getItem("a4p_logo_dataurl");
  if(stored){
    applyLogo(stored);
  }
}
function setupLogoInputs(){
  const input = document.getElementById("logo-input");
  const reset = document.getElementById("logo-reset");
  if(input){
    input.addEventListener("change", (e)=>{
      const file = e.target.files && e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        localStorage.setItem("a4p_logo_dataurl", dataUrl);
        applyLogo(dataUrl);
      };
      reader.readAsDataURL(file);
    });
  }
  if(reset){
    reset.addEventListener("click", ()=>{
      localStorage.removeItem("a4p_logo_dataurl");
      applyLogo("assets/logo.svg");
    });
  }
}
// call on DOM ready-ish
document.addEventListener("DOMContentLoaded", ()=>{
  loadLogo();
  setupLogoInputs();
});
