const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const d3 = window.d3;

if (gsap && ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
}

const OPENAI_STORAGE_KEY = "inspired.openai.key";
const OPENAI_MODEL = "gpt-5.5";

const mapPoints = document.querySelectorAll(".map-point");
const mapCity = document.getElementById("map-city");
const mapRole = document.getElementById("map-role");
const mapCopy = document.getElementById("map-copy");
const mapStage = document.querySelector(".map-frame");
const mapSvg = document.getElementById("colombia-map-svg");
const mapLayer = document.getElementById("colombia-map-layer");
const journeyNodes = document.querySelectorAll(".journey-node");
const trackedSections = document.querySelectorAll("[data-section]");
const ambientA = document.querySelector(".ambient-a");
const ambientB = document.querySelector(".ambient-b");
const actionButtons = document.querySelectorAll("[data-target]");
const statusText = document.getElementById("status-text");
const launchButton = document.querySelector(".launch-button");
const ideaInput = document.getElementById("business-idea");
const heroSummary = document.getElementById("hero-summary");
const inputTitle = document.getElementById("input-title");
const inputCopy = document.getElementById("input-copy");
const benchmarkTitle = document.getElementById("benchmark-title");
const benchmarkCopy = document.getElementById("benchmark-copy");
const translationTitle = document.getElementById("translation-title");
const translationCopy = document.getElementById("translation-copy");
const benchmarkHeading = document.getElementById("benchmark-heading");
const benchmarkSummary = document.getElementById("benchmark-summary");
const agentRationale = document.getElementById("agent-rationale");
const reportFocus = document.getElementById("report-focus");
const clientLabel = document.getElementById("client-label");
const referenceLabel = document.getElementById("reference-label");
const clientPoints = document.getElementById("client-points");
const referencePoints = document.getElementById("reference-points");
const teamCopies = document.querySelectorAll("[data-team-copy]");
const agentModeLabel = document.getElementById("agent-mode-label");
const openAiSettingsButton = document.getElementById("open-ai-settings");
const settingsModal = document.getElementById("ai-settings-modal");
const settingsStatus = document.getElementById("settings-status");
const apiKeyInput = document.getElementById("openai-api-key");
const saveKeyButton = document.getElementById("save-openai-key");
const clearKeyButton = document.getElementById("clear-openai-key");
const closeSettingsButtons = document.querySelectorAll("[data-close-settings]");

const statusMessages = [
  "Escuchando la idea y preparando el benchmark ideal.",
  "Buscando una referencia internacional creíble para esta categoría.",
  "Traduciendo la brecha competitiva al mercado colombiano.",
  "Priorizando territorios y ejecución por equipo.",
];

let statusIndex = 0;

if (statusText) {
  window.setInterval(() => {
    statusIndex = (statusIndex + 1) % statusMessages.length;
    statusText.textContent = statusMessages[statusIndex];
  }, 3200);
}

hydrateConnectionUi();
bindSettingsUi();
initializeMap();

mapPoints.forEach((point) => {
  point.addEventListener("mouseenter", () => updateMapPanel(point));
  point.addEventListener("focus", () => updateMapPanel(point));
  point.addEventListener("click", () => updateMapPanel(point));
});

actionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.querySelector(button.dataset.target);
    if (!target) {
      return;
    }

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
});

if (launchButton) {
  launchButton.addEventListener("click", () => {
    void runAgentExperience();
  });
}

trackedSections.forEach((section) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const sectionId = `#${section.id || "top"}`;
        journeyNodes.forEach((node) => {
          node.classList.toggle("active", node.dataset.target === sectionId);
        });
      });
    },
    { threshold: 0.48 }
  );

  observer.observe(section);
});

window.addEventListener(
  "scroll",
  () => {
    const offset = window.scrollY;

    if (ambientA) {
      ambientA.style.transform = `translate3d(0, ${offset * 0.05}px, 0)`;
    }

    if (ambientB) {
      ambientB.style.transform = `translate3d(0, ${offset * -0.04}px, 0)`;
    }
  },
  { passive: true }
);

window.addEventListener("resize", () => {
  positionMapPoints();
});

if (gsap && ScrollTrigger) {
  gsap.from(".site-header", {
    y: -24,
    autoAlpha: 0,
    duration: 0.9,
    ease: "power3.out",
  });

  gsap.from([".hero-copy", ".hero-system"], {
    y: 18,
    autoAlpha: 0,
    duration: 0.9,
    ease: "power3.out",
    clearProps: "opacity,visibility,transform",
  });

  gsap.utils.toArray(".reveal").forEach((element) => {
    gsap.from(element, {
      y: 38,
      autoAlpha: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: element,
        start: "top 86%",
        once: true,
      },
    });
  });

  gsap.to(".hero-copy", {
    yPercent: -6,
    opacity: 0.8,
    scrollTrigger: {
      trigger: ".hero-slide",
      start: "top top",
      end: "bottom top",
      scrub: 1,
    },
  });

  gsap.to(".hero-system", {
    yPercent: -4,
    scrollTrigger: {
      trigger: ".hero-slide",
      start: "top top",
      end: "bottom top",
      scrub: 1,
    },
  });
}

function bindSettingsUi() {
  openAiSettingsButton?.addEventListener("click", openSettingsModal);
  saveKeyButton?.addEventListener("click", saveApiKey);
  clearKeyButton?.addEventListener("click", clearApiKey);
  closeSettingsButtons.forEach((button) => {
    button.addEventListener("click", closeSettingsModal);
  });
}

function openSettingsModal() {
  if (!settingsModal) {
    return;
  }

  settingsModal.hidden = false;
  apiKeyInput?.focus();
}

function closeSettingsModal() {
  if (!settingsModal) {
    return;
  }

  settingsModal.hidden = true;
}

function saveApiKey() {
  const key = apiKeyInput?.value.trim();

  if (!key) {
    updateSettingsStatus("Pega una clave válida para activar el modo OpenAI.");
    return;
  }

  window.localStorage.setItem(OPENAI_STORAGE_KEY, key);
  hydrateConnectionUi();
  updateSettingsStatus("Clave guardada localmente. Inspired ya puede elegir una empresa real con OpenAI.");
  closeSettingsModal();
}

function clearApiKey() {
  window.localStorage.removeItem(OPENAI_STORAGE_KEY);

  if (apiKeyInput) {
    apiKeyInput.value = "";
  }

  hydrateConnectionUi();
  updateSettingsStatus("Clave eliminada. El flujo vuelve a modo simulación premium.");
}

function hydrateConnectionUi() {
  const hasKey = Boolean(getStoredApiKey());

  if (apiKeyInput && hasKey) {
    apiKeyInput.value = getStoredApiKey();
  }

  if (agentModeLabel) {
    agentModeLabel.textContent = hasKey ? "OpenAI conectado" : "Modo simulación premium";
  }

  if (settingsStatus) {
    settingsStatus.textContent = hasKey
      ? "Clave guardada. El agente usará OpenAI para elegir una empresa real y el resto del análisis seguirá siendo simulado."
      : "Sin clave guardada. El flujo usará modo simulación premium.";
  }
}

function updateSettingsStatus(message) {
  if (settingsStatus) {
    settingsStatus.textContent = message;
  }
}

function getStoredApiKey() {
  return window.localStorage.getItem(OPENAI_STORAGE_KEY) || "";
}

async function initializeMap() {
  if (!d3 || !mapSvg || !mapLayer) {
    return;
  }

  const geojson = window.COLOMBIA_GEOJSON;
  if (!geojson) {
    console.error("No se encontró la geometría local de Colombia.");
    return;
  }

  renderColombiaMap(geojson);
}

function renderColombiaMap(geojson) {
  const width = 540;
  const height = 760;
  const mapOffsetX = 34;
  const mapOffsetY = 24;

  const projection = d3.geoMercator().fitSize([width - mapOffsetX * 2, height - mapOffsetY * 2], geojson);
  const path = d3.geoPath(projection);
  const svg = d3.select(mapLayer);

  svg.selectAll("*").remove();

  svg
    .append("g")
    .attr("transform", `translate(${mapOffsetX}, ${mapOffsetY})`)
    .selectAll("path")
    .data(geojson.features)
    .join("path")
    .attr("class", "colombia-department")
    .attr("d", path);

  svg
    .append("g")
    .attr("transform", `translate(${mapOffsetX}, ${mapOffsetY})`)
    .append("path")
    .datum(geojson)
    .attr("class", "colombia-outline")
    .attr("d", path);

  mapPoints.forEach((point) => {
    const lon = Number(point.dataset.lon);
    const lat = Number(point.dataset.lat);
    const [x, y] = projection([lon, lat]);
    point.style.left = `${x + mapOffsetX + 12}px`;
    point.style.top = `${y + mapOffsetY}px`;
  });

  if (mapPoints[0]) {
    updateMapPanel(mapPoints[0]);
  }
}

function positionMapPoints() {
  if (!mapStage || !mapSvg) {
    return;
  }
}

function updateMapPanel(point) {
  if (!mapCity || !mapRole || !mapCopy) {
    return;
  }

  mapPoints.forEach((item) => item.classList.remove("active"));
  point.classList.add("active");
  mapCity.textContent = point.dataset.city;
  mapRole.textContent = point.dataset.role;
  mapCopy.textContent = point.dataset.copy;
}

async function runAgentExperience() {
  const prompt = (ideaInput?.value || "").trim();

  if (!prompt) {
    if (statusText) {
      statusText.textContent = "Escribe una idea para activar el research.";
    }
    ideaInput?.focus();
    return;
  }

  if (launchButton) {
    launchButton.disabled = true;
    launchButton.textContent = "Procesando...";
  }

  if (statusText) {
    statusText.textContent = "Buscando la mejor empresa referente para tu idea.";
  }

  try {
    const agentReference = await resolveReferenceCompany(prompt);
    const result = generateAgentResult(prompt, agentReference);
    applyAgentResult(result);

    if (statusText) {
      statusText.textContent = `Benchmark listo: ${result.referenceCompany}.`;
    }

    reportFocus?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  } catch (error) {
    console.error(error);
    if (statusText) {
      statusText.textContent = "No pudimos resolver el benchmark ahora mismo. Probemos de nuevo.";
    }
  } finally {
    if (launchButton) {
      launchButton.disabled = false;
      launchButton.textContent = "Activar research";
    }
  }
}

async function resolveReferenceCompany(prompt) {
  const apiKey = getStoredApiKey();

  if (!apiKey) {
    return {
      mode: "simulation",
      rationale:
        "Usando simulación premium: elegimos una referencia internacional plausible y construimos una traducción estratégica creíble para el prototipo.",
    };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You are the benchmark selector for Inspired, a Colombian strategy agency. Choose exactly one real company from the United States or Europe that best matches the user's business idea. Do not claim live research, do not fabricate browsing, and keep the rest of the strategic analysis simulated. Return only valid JSON with keys: referenceCompany, category, region, rationale, citySignals. citySignals must be an object with optional keys Bogota, Medellin, Cali, Barranquilla, Bucaramanga. Keep rationale under 35 words.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: prompt,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error ${response.status}`);
  }

  const payload = await response.json();
  const text = payload.output_text || extractOutputText(payload);

  try {
    return {
      mode: "openai",
      ...JSON.parse(text),
    };
  } catch (error) {
    console.warn("No se pudo parsear JSON de OpenAI. Usando simulación.", error);
    return {
      mode: "simulation",
      rationale:
        "OpenAI no devolvió el formato esperado. Conservamos la experiencia con una referencia simulada de alta calidad.",
    };
  }
}

function extractOutputText(payload) {
  const texts = [];
  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) {
        texts.push(content.text);
      }
    }
  }
  return texts.join("");
}

function generateAgentResult(prompt, agentReference) {
  const lower = prompt.toLowerCase();

  const categoryMap = [
    {
      test: ["clinica", "clínica", "dental", "salud", "médico", "medico", "estetica", "estética"],
      key: "salud premium",
      fallbackReference: "Rodeo Dental & Orthodontics",
      citySignals: {
        Bogotá: "Alta densidad de demanda premium, validación rápida y pacientes de ticket elevado.",
        Medellín: "Mercado ideal para adoptar una experiencia de servicio aspiracional y tecnológica.",
        Cali: "Buen espacio para consolidar marca y servicio recurrente con diferenciación clara.",
      },
    },
    {
      test: ["restaurante", "food", "cafeteria", "cafetería", "cafe", "café", "comida", "delivery"],
      key: "food service",
      fallbackReference: "Sweetgreen",
      citySignals: {
        Bogotá: "Escala suficiente para validar recurrencia, ticket y expansión por zonas.",
        Medellín: "Fuerte adopción de conceptos de marca con diseño y experiencia.",
        Barranquilla: "Buen laboratorio para expansión regional y visibilidad acelerada.",
      },
    },
    {
      test: ["saas", "software", "crm", "app", "ia", "ai", "agente"],
      key: "software intelligence",
      fallbackReference: "HubSpot",
      citySignals: {
        Bogotá: "Mayor concentración de empresas objetivo para pruebas de adquisición B2B.",
        Medellín: "Ecosistema fuerte para alianzas, pilotos y casos de estudio.",
        Bucaramanga: "Buena plaza para validar ventas eficientes y procesos replicables.",
      },
    },
  ];

  const matched =
    categoryMap.find((entry) => entry.test.some((token) => lower.includes(token))) || {
      key: "servicio premium",
      fallbackReference: "Soho House",
      citySignals: {
        Bogotá: "Masa crítica suficiente para validar una propuesta premium con posicionamiento fuerte.",
        Medellín: "Buena velocidad de adopción para conceptos aspiracionales y diferenciados.",
        Cali: "Espacio para construir marca y operación con menor ruido competitivo.",
      },
    };

  const promptSlice = prompt.length > 160 ? `${prompt.slice(0, 160)}...` : prompt;
  const referenceCompany = agentReference.referenceCompany || matched.fallbackReference;
  const region = agentReference.region || (lower.includes("europa") ? "Europa" : "USA + Europa");
  const category = agentReference.category || matched.key;
  const rationale =
    agentReference.rationale ||
    `Elegimos ${referenceCompany} como referencia plausible para esta categoría y convertimos el resto del análisis en una simulación estratégica controlada.`;
  const citySignals = {
    ...matched.citySignals,
    ...(agentReference.citySignals || {}),
  };

  return {
    referenceCompany,
    referenceCountry: region,
    rationale,
    heroSummaryText: `Detectamos una oportunidad de ${category} con una referencia principal en ${region}. Ahora la tarea es traducir esa ventaja internacional en narrativa, oferta, territorio y ejecución para Colombia.`,
    input: {
      title: "Prompt decoded",
      copy: `La idea fue leída como una apuesta de ${category}. Señal base: ${promptSlice}`,
    },
    benchmark: {
      title: referenceCompany,
      copy: `Elegimos ${referenceCompany} como caso de estudio central por similitud operativa, narrativa y potencial de adaptación al mercado colombiano.`,
    },
    translation: {
      title: "Colombia execution route",
      copy: "La diferencia entre el benchmark y tu negocio se convierte en una secuencia concreta de posicionamiento, expansión y operación.",
    },
    board: {
      clientLabel: "Tu negocio hoy",
      referenceLabel: referenceCompany,
      clientPoints: [
        "Idea con potencial todavía sin benchmark operativo dominante.",
        "Oferta aún sin una narrativa de categoría totalmente afilada.",
        "Expansión local sin jerarquía geográfica clara.",
      ],
      referencePoints: [
        `Modelo ya validado en ${region}.`,
        "Narrativa y percepción de valor altamente refinadas.",
        "Sistema comercial y operativo listo para replicarse.",
      ],
    },
    map: citySignals,
    team: {
      miguel: `Convierte la visión general de ${referenceCompany} en prioridades ejecutivas, orden de implementación y decisiones de alto impacto para Colombia.`,
      isabela: `Diseña la estrategia de marketing inspirada en ${referenceCompany} para capturar demanda y acelerar validación local.`,
      sofia: `Aterriza el universo visual y la percepción de marca que mejor traducen el estándar de ${referenceCompany} al mercado colombiano.`,
      juan: "Construye el sistema visual que hace visible la categoría, la diferenciación y la autoridad de la nueva propuesta.",
      maria: "Activa comunidad, conversación y validación de mercado con contenidos y señales de adopción reales.",
      daniel: `Profundiza el benchmark ${referenceCompany}, detecta brechas y convierte el análisis en una ruta estratégica accionable.`,
      nicolas: "Organiza la ejecución operativa en fases, responsables y entregables para que el plan realmente se implemente.",
    },
  };
}

function applyAgentResult(result) {
  if (heroSummary) {
    heroSummary.textContent = result.heroSummaryText;
  }

  if (inputTitle) {
    inputTitle.textContent = result.input.title;
  }

  if (inputCopy) {
    inputCopy.textContent = result.input.copy;
  }

  if (benchmarkTitle) {
    benchmarkTitle.textContent = result.benchmark.title;
  }

  if (benchmarkCopy) {
    benchmarkCopy.textContent = result.benchmark.copy;
  }

  if (translationTitle) {
    translationTitle.textContent = result.translation.title;
  }

  if (translationCopy) {
    translationCopy.textContent = result.translation.copy;
  }

  if (benchmarkHeading) {
    benchmarkHeading.textContent = `${result.referenceCompany}: el caso central para esta oportunidad.`;
  }

  if (benchmarkSummary) {
    benchmarkSummary.textContent = `Tomamos a ${result.referenceCompany} como espejo avanzado para adaptar su lógica ganadora al mercado colombiano sin dispersión.`;
  }

  if (agentRationale) {
    agentRationale.textContent = result.rationale;
  }

  if (clientLabel) {
    clientLabel.textContent = result.board.clientLabel;
  }

  if (referenceLabel) {
    referenceLabel.textContent = result.board.referenceLabel;
  }

  replaceList(clientPoints, result.board.clientPoints);
  replaceList(referencePoints, result.board.referencePoints);

  const signalEntries = [
    {
      city: "Bogotá",
      role: "Capital de escala",
      copy: result.map.Bogotá || "Señal principal de demanda y volumen.",
    },
    {
      city: "Medellín",
      role: "Hub de adopción",
      copy: result.map.Medellín || "Señal principal de adopción y velocidad.",
    },
    {
      city: "Cali",
      role: "Mercado de consolidación",
      copy: result.map.Cali || "Señal de consolidación y expansión operativa.",
    },
    {
      city: "Barranquilla",
      role: "Puerta Caribe",
      copy: result.map.Barranquilla || "Señal regional para amplificar presencia.",
    },
    {
      city: "Bucaramanga",
      role: "Nodo de eficiencia",
      copy: result.map.Bucaramanga || "Señal de eficiencia y validación de márgenes.",
    },
  ];

  mapPoints.forEach((point, index) => {
    const entry = signalEntries[index];
    if (!entry) {
      return;
    }

    point.dataset.city = entry.city;
    point.dataset.role = entry.role;
    point.dataset.copy = entry.copy;
    point.lastChild.textContent = entry.city;
  });

  if (mapPoints[0]) {
    updateMapPanel(mapPoints[0]);
  }

  teamCopies.forEach((node) => {
    const key = node.dataset.teamCopy;
    if (result.team[key]) {
      node.textContent = result.team[key];
    }
  });
}

function replaceList(listNode, items) {
  if (!listNode) {
    return;
  }

  listNode.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
}
