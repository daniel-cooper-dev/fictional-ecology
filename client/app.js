"use strict";
(() => {
  // client-src/uuid.ts
  function generateId() {
    return crypto.randomUUID();
  }
  function now() {
    return (/* @__PURE__ */ new Date()).toISOString();
  }

  // client-src/store.ts
  function getJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
  function setJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("localStorage write failed (storage full?):", key, e);
      alert("Storage is full. Try deleting some worlds or exporting your data.");
    }
  }
  var KEYS = {
    worlds: "fe:worlds",
    constellations: "fe:constellations",
    elements: (worldId) => `fe:world:${worldId}:elements`,
    relationships: (worldId) => `fe:world:${worldId}:relationships`,
    tags: (worldId) => `fe:world:${worldId}:tags`,
    elementTags: (worldId) => `fe:world:${worldId}:element_tags`,
    eras: (worldId) => `fe:world:${worldId}:eras`
  };
  var store = {
    // ==================== WORLDS ====================
    listWorlds() {
      return getJSON(KEYS.worlds, []).sort(
        (a, b) => (b.updated_at || "").localeCompare(a.updated_at || "")
      );
    },
    getWorld(id) {
      return this.listWorlds().find((w) => w.id === id);
    },
    createWorld(data) {
      const worlds = getJSON(KEYS.worlds, []);
      const world = {
        id: generateId(),
        name: data.name,
        tagline: data.tagline || "",
        description: data.description || "",
        magic_enabled: data.magic_enabled !== false,
        settings: "{}",
        created_at: now(),
        updated_at: now(),
        forked_from: null,
        constellation_id: data.constellation_id || null,
        blueprint_id: data.blueprint_id || null
      };
      worlds.push(world);
      setJSON(KEYS.worlds, worlds);
      setJSON(KEYS.elements(world.id), []);
      setJSON(KEYS.relationships(world.id), []);
      setJSON(KEYS.tags(world.id), []);
      setJSON(KEYS.elementTags(world.id), []);
      setJSON(KEYS.eras(world.id), []);
      return world;
    },
    updateWorld(id, data) {
      const worlds = getJSON(KEYS.worlds, []);
      const idx = worlds.findIndex((w) => w.id === id);
      if (idx === -1) return void 0;
      const updated = { ...worlds[idx], ...data, updated_at: now() };
      updated.id = worlds[idx].id;
      updated.created_at = worlds[idx].created_at;
      worlds[idx] = updated;
      setJSON(KEYS.worlds, worlds);
      return updated;
    },
    deleteWorld(id) {
      const worlds = getJSON(KEYS.worlds, []).filter((w) => w.id !== id);
      setJSON(KEYS.worlds, worlds);
      localStorage.removeItem(KEYS.elements(id));
      localStorage.removeItem(KEYS.relationships(id));
      localStorage.removeItem(KEYS.tags(id));
      localStorage.removeItem(KEYS.elementTags(id));
      localStorage.removeItem(KEYS.eras(id));
    },
    getWorldStats(worldId) {
      const elements = getJSON(KEYS.elements(worldId), []);
      const stats = {};
      for (const el of elements) {
        stats[el.domain] = (stats[el.domain] || 0) + 1;
      }
      return stats;
    },
    // ==================== CONSTELLATIONS ====================
    listConstellations() {
      return getJSON(KEYS.constellations, []).sort(
        (a, b) => b.updated_at.localeCompare(a.updated_at)
      );
    },
    getConstellation(id) {
      return this.listConstellations().find((c) => c.id === id);
    },
    createConstellation(data) {
      const constellations = getJSON(KEYS.constellations, []);
      const constellation = {
        id: generateId(),
        name: data.name,
        description: data.description || "",
        color: data.color || "#6366f1",
        created_at: now(),
        updated_at: now()
      };
      constellations.push(constellation);
      setJSON(KEYS.constellations, constellations);
      return constellation;
    },
    updateConstellation(id, data) {
      const constellations = getJSON(KEYS.constellations, []);
      const idx = constellations.findIndex((c) => c.id === id);
      if (idx === -1) return void 0;
      const updated = { ...constellations[idx], ...data, updated_at: now() };
      updated.id = constellations[idx].id;
      updated.created_at = constellations[idx].created_at;
      constellations[idx] = updated;
      setJSON(KEYS.constellations, constellations);
      return updated;
    },
    deleteConstellation(id) {
      const constellations = getJSON(KEYS.constellations, []).filter((c) => c.id !== id);
      setJSON(KEYS.constellations, constellations);
      const worlds = getJSON(KEYS.worlds, []);
      for (const w of worlds) {
        if (w.constellation_id === id) w.constellation_id = null;
      }
      setJSON(KEYS.worlds, worlds);
    },
    getConstellationWorlds(constellationId) {
      return this.listWorlds().filter((w) => w.constellation_id === constellationId);
    },
    getUnlinkedWorlds() {
      return this.listWorlds().filter((w) => !w.constellation_id);
    },
    addWorldToConstellation(constellationId, worldId) {
      this.updateWorld(worldId, { constellation_id: constellationId });
    },
    removeWorldFromConstellation(worldId) {
      this.updateWorld(worldId, { constellation_id: null });
    },
    // ==================== ELEMENTS ====================
    listElements(worldId, domain, type, sortBy, sortDir) {
      let elements = getJSON(KEYS.elements(worldId), []);
      if (domain) elements = elements.filter((e) => e.domain === domain);
      if (type) elements = elements.filter((e) => e.element_type === type);
      const field = sortBy || "updated_at";
      const dir = sortDir || "desc";
      elements.sort((a, b) => {
        const va = a[field] ?? "";
        const vb = b[field] ?? "";
        return dir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
      });
      return elements;
    },
    getElement(worldId, elementId) {
      return getJSON(KEYS.elements(worldId), []).find((e) => e.id === elementId);
    },
    createElement(worldId, data) {
      const elements = getJSON(KEYS.elements(worldId), []);
      const element = {
        id: generateId(),
        world_id: worldId,
        domain: data.domain,
        element_type: data.element_type || "",
        name: data.name,
        summary: data.summary || "",
        detailed_notes: data.detailed_notes || "",
        properties: JSON.stringify(data.properties || {}),
        created_at: now(),
        updated_at: now()
      };
      elements.push(element);
      setJSON(KEYS.elements(worldId), elements);
      return element;
    },
    updateElement(worldId, elementId, data) {
      const elements = getJSON(KEYS.elements(worldId), []);
      const idx = elements.findIndex((e) => e.id === elementId);
      if (idx === -1) return void 0;
      if (data.name !== void 0) elements[idx].name = data.name;
      if (data.element_type !== void 0) elements[idx].element_type = data.element_type;
      if (data.summary !== void 0) elements[idx].summary = data.summary;
      if (data.detailed_notes !== void 0) elements[idx].detailed_notes = data.detailed_notes;
      if (data.properties !== void 0) elements[idx].properties = JSON.stringify(data.properties);
      elements[idx].updated_at = now();
      setJSON(KEYS.elements(worldId), elements);
      return elements[idx];
    },
    deleteElement(worldId, elementId) {
      const elements = getJSON(KEYS.elements(worldId), []).filter((e) => e.id !== elementId);
      setJSON(KEYS.elements(worldId), elements);
      const rels = getJSON(KEYS.relationships(worldId), []).filter((r) => r.source_id !== elementId && r.target_id !== elementId);
      setJSON(KEYS.relationships(worldId), rels);
      const ets = getJSON(KEYS.elementTags(worldId), []).filter((et) => et.element_id !== elementId);
      setJSON(KEYS.elementTags(worldId), ets);
    },
    // ==================== RELATIONSHIPS ====================
    listRelationships(worldId, elementId) {
      let rels = getJSON(KEYS.relationships(worldId), []);
      if (elementId) {
        rels = rels.filter((r) => r.source_id === elementId || r.target_id === elementId);
      }
      return rels.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    },
    createRelationship(worldId, data) {
      const rels = getJSON(KEYS.relationships(worldId), []);
      const rel = {
        id: generateId(),
        world_id: worldId,
        source_id: data.source_id,
        target_id: data.target_id,
        relationship_type: data.relationship_type,
        description: data.description || "",
        strength: data.strength || "moderate",
        bidirectional: data.bidirectional ?? false,
        created_at: now()
      };
      rels.push(rel);
      setJSON(KEYS.relationships(worldId), rels);
      return rel;
    },
    deleteRelationship(worldId, relId) {
      const rels = getJSON(KEYS.relationships(worldId), []).filter((r) => r.id !== relId);
      setJSON(KEYS.relationships(worldId), rels);
    },
    // ==================== TAGS ====================
    listTags(worldId) {
      const tags = getJSON(KEYS.tags(worldId), []);
      const ets = getJSON(KEYS.elementTags(worldId), []);
      return tags.map((t) => ({
        ...t,
        element_count: ets.filter((et) => et.tag_id === t.id).length
      })).sort((a, b) => a.name.localeCompare(b.name));
    },
    listElementTags(worldId, elementId) {
      const tags = getJSON(KEYS.tags(worldId), []);
      const ets = getJSON(KEYS.elementTags(worldId), []);
      const tagIds = new Set(ets.filter((et) => et.element_id === elementId).map((et) => et.tag_id));
      return tags.filter((t) => tagIds.has(t.id));
    },
    createTag(worldId, name, color) {
      const tags = getJSON(KEYS.tags(worldId), []);
      const existing = tags.find((t) => t.name.trim().toLowerCase() === name.trim().toLowerCase());
      if (existing) return existing;
      const tag = {
        id: generateId(),
        world_id: worldId,
        name: name.trim(),
        color: color || "#4a9eff"
      };
      tags.push(tag);
      setJSON(KEYS.tags(worldId), tags);
      return tag;
    },
    deleteTag(worldId, tagId) {
      const tags = getJSON(KEYS.tags(worldId), []).filter((t) => t.id !== tagId);
      setJSON(KEYS.tags(worldId), tags);
      const ets = getJSON(KEYS.elementTags(worldId), []).filter((et) => et.tag_id !== tagId);
      setJSON(KEYS.elementTags(worldId), ets);
    },
    addTagToElement(worldId, elementId, tagId) {
      const ets = getJSON(KEYS.elementTags(worldId), []);
      if (!ets.some((et) => et.element_id === elementId && et.tag_id === tagId)) {
        ets.push({ element_id: elementId, tag_id: tagId });
        setJSON(KEYS.elementTags(worldId), ets);
      }
    },
    removeTagFromElement(worldId, elementId, tagId) {
      const ets = getJSON(KEYS.elementTags(worldId), []).filter((et) => !(et.element_id === elementId && et.tag_id === tagId));
      setJSON(KEYS.elementTags(worldId), ets);
    },
    // ==================== ERAS ====================
    listEras(worldId) {
      return getJSON(KEYS.eras(worldId), []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || (a.start_year ?? 0) - (b.start_year ?? 0));
    },
    createEra(worldId, data) {
      const eras = getJSON(KEYS.eras(worldId), []);
      const era = {
        id: generateId(),
        world_id: worldId,
        calendar_id: null,
        name: data.name,
        start_year: data.start_year ?? 0,
        end_year: data.end_year ?? null,
        description: data.description || "",
        color: data.color || "#4a9eff",
        sort_order: data.sort_order ?? eras.length
      };
      eras.push(era);
      setJSON(KEYS.eras(worldId), eras);
      return era;
    },
    updateEra(worldId, eraId, data) {
      const eras = getJSON(KEYS.eras(worldId), []);
      const idx = eras.findIndex((e) => e.id === eraId);
      if (idx === -1) return void 0;
      const updated = { ...eras[idx], ...data };
      updated.id = eras[idx].id;
      updated.world_id = eras[idx].world_id;
      eras[idx] = updated;
      setJSON(KEYS.eras(worldId), eras);
      return updated;
    },
    deleteEra(worldId, eraId) {
      const eras = getJSON(KEYS.eras(worldId), []).filter((e) => e.id !== eraId);
      setJSON(KEYS.eras(worldId), eras);
    },
    // ==================== SEARCH ====================
    search(worldId, query, domain) {
      if (!query.trim()) return [];
      const q = query.toLowerCase();
      let elements = getJSON(KEYS.elements(worldId), []);
      if (domain) elements = elements.filter((e) => e.domain === domain);
      return elements.filter(
        (e) => (e.name || "").toLowerCase().includes(q) || (e.summary || "").toLowerCase().includes(q) || (e.detailed_notes || "").toLowerCase().includes(q)
      ).slice(0, 50).map((e) => {
        let snippet = e.summary || e.detailed_notes || "";
        const idx = snippet.toLowerCase().indexOf(q);
        if (idx >= 0) {
          const start = Math.max(0, idx - 30);
          const end = Math.min(snippet.length, idx + q.length + 30);
          snippet = (start > 0 ? "..." : "") + snippet.slice(start, end) + (end < snippet.length ? "..." : "");
        } else {
          snippet = snippet.slice(0, 80) + (snippet.length > 80 ? "..." : "");
        }
        return {
          element_id: e.id,
          domain: e.domain,
          element_type: e.element_type,
          name: e.name,
          snippet
        };
      });
    },
    // ==================== IMPORT / EXPORT ====================
    exportWorld(worldId) {
      const world = this.getWorld(worldId);
      if (!world) return null;
      return {
        version: 2,
        type: "world",
        exported_at: now(),
        world: { ...world },
        elements: getJSON(KEYS.elements(worldId), []),
        relationships: getJSON(KEYS.relationships(worldId), []),
        tags: getJSON(KEYS.tags(worldId), []),
        element_tags: getJSON(KEYS.elementTags(worldId), []),
        eras: getJSON(KEYS.eras(worldId), [])
      };
    },
    exportConstellation(constellationId) {
      const constellation = this.getConstellation(constellationId);
      if (!constellation) return null;
      const worlds = this.getConstellationWorlds(constellationId);
      return {
        version: 2,
        type: "constellation",
        exported_at: now(),
        constellation: { ...constellation },
        worlds: worlds.map((w) => ({
          world: { ...w },
          elements: getJSON(KEYS.elements(w.id), []),
          relationships: getJSON(KEYS.relationships(w.id), []),
          tags: getJSON(KEYS.tags(w.id), []),
          element_tags: getJSON(KEYS.elementTags(w.id), []),
          eras: getJSON(KEYS.eras(w.id), [])
        }))
      };
    },
    importData(json) {
      const result = { worldIds: [] };
      if (!json || typeof json !== "object" || !json.type || !json.version) {
        return result;
      }
      if (json.type === "constellation" && json.constellation && json.worlds) {
        const idMap = /* @__PURE__ */ new Map();
        const oldConstellationId = json.constellation.id;
        const newConstellationId = generateId();
        idMap.set(oldConstellationId, newConstellationId);
        const constellation = {
          ...json.constellation,
          id: newConstellationId,
          created_at: now(),
          updated_at: now()
        };
        const constellations = getJSON(KEYS.constellations, []);
        constellations.push(constellation);
        setJSON(KEYS.constellations, constellations);
        result.constellationId = newConstellationId;
        for (const worldData of json.worlds) {
          const wId = this._importWorldData(worldData, newConstellationId, idMap);
          result.worldIds.push(wId);
        }
      } else if (json.type === "world" && json.world) {
        const idMap = /* @__PURE__ */ new Map();
        const wId = this._importWorldData(json, null, idMap);
        result.worldIds.push(wId);
      }
      return result;
    },
    _importWorldData(data, constellationId, idMap) {
      const oldWorldId = data.world.id;
      const newWorldId = generateId();
      idMap.set(oldWorldId, newWorldId);
      const elements = (data.elements || []).map((e) => {
        const newId = generateId();
        idMap.set(e.id, newId);
        return { ...e, id: newId, world_id: newWorldId };
      });
      const relationships = (data.relationships || []).filter((r) => idMap.has(r.source_id) && idMap.has(r.target_id)).map((r) => ({
        ...r,
        id: generateId(),
        world_id: newWorldId,
        source_id: idMap.get(r.source_id),
        target_id: idMap.get(r.target_id)
      }));
      const tags = (data.tags || []).map((t) => {
        const newId = generateId();
        idMap.set(t.id, newId);
        return { ...t, id: newId, world_id: newWorldId };
      });
      const elementTags = (data.element_tags || []).filter((et) => idMap.has(et.element_id) && idMap.has(et.tag_id)).map((et) => ({
        element_id: idMap.get(et.element_id),
        tag_id: idMap.get(et.tag_id)
      }));
      const eras = (data.eras || []).map((e) => ({
        ...e,
        id: generateId(),
        world_id: newWorldId
      }));
      const world = {
        ...data.world,
        id: newWorldId,
        constellation_id: constellationId,
        created_at: now(),
        updated_at: now()
      };
      const worlds = getJSON(KEYS.worlds, []);
      worlds.push(world);
      setJSON(KEYS.worlds, worlds);
      setJSON(KEYS.elements(newWorldId), elements);
      setJSON(KEYS.relationships(newWorldId), relationships);
      setJSON(KEYS.tags(newWorldId), tags);
      setJSON(KEYS.elementTags(newWorldId), elementTags);
      setJSON(KEYS.eras(newWorldId), eras);
      return newWorldId;
    },
    // ==================== UTILITIES ====================
    clearAll() {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("fe:")) keys.push(key);
      }
      for (const key of keys) localStorage.removeItem(key);
    },
    getStorageUsage() {
      let used = 0;
      let keys = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("fe:")) {
          used += (localStorage.getItem(key) || "").length * 2;
          keys++;
        }
      }
      return { used, keys };
    }
  };

  // client-src/router.ts
  var ROUTE_PATTERNS = [
    { pattern: /^\/worlds\/new\/wizard$/, page: "onboarding", paramNames: [] },
    { pattern: /^\/worlds\/new$/, page: "world-new", paramNames: [] },
    { pattern: /^\/worlds\/([^/]+)\/([^/]+)\/new$/, page: "element-new", paramNames: ["worldId", "domainId"] },
    { pattern: /^\/worlds\/([^/]+)\/([^/]+)\/([^/]+)\/edit$/, page: "element-edit", paramNames: ["worldId", "domainId", "elementId"] },
    { pattern: /^\/worlds\/([^/]+)\/([^/]+)\/([^/]+)$/, page: "element-detail", paramNames: ["worldId", "domainId", "elementId"] },
    { pattern: /^\/worlds\/([^/]+)\/timeline$/, page: "timeline", paramNames: ["worldId"] },
    { pattern: /^\/worlds\/([^/]+)\/([^/]+)$/, page: "domain-list", paramNames: ["worldId", "domainId"] },
    { pattern: /^\/worlds\/([^/]+)$/, page: "world-dashboard", paramNames: ["worldId"] },
    { pattern: /^\/worlds\/?$/, page: "home", paramNames: [] },
    { pattern: /^\/constellations\/new$/, page: "constellation-new", paramNames: [] },
    { pattern: /^\/constellations\/([^/]+)$/, page: "constellation-detail", paramNames: ["constellationId"] },
    { pattern: /^\/blueprints\/([^/]+)$/, page: "blueprint-detail", paramNames: ["blueprintId"] },
    { pattern: /^\/blueprints\/?$/, page: "blueprint-list", paramNames: [] },
    { pattern: /^\/archetypes\/?$/, page: "archetype-search", paramNames: [] },
    { pattern: /^\/?$/, page: "home", paramNames: [] }
  ];
  function parseRoute() {
    const hash = location.hash.slice(1) || "/";
    const [pathPart, queryPart] = hash.split("?");
    const path = pathPart || "/";
    const query = {};
    if (queryPart) {
      for (const pair of queryPart.split("&")) {
        const [k, v] = pair.split("=");
        if (k) query[decodeURIComponent(k)] = decodeURIComponent(v || "");
      }
    }
    for (const route of ROUTE_PATTERNS) {
      const match = path.match(route.pattern);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, i) => {
          params[name] = decodeURIComponent(match[i + 1]);
        });
        return { page: route.page, params, query };
      }
    }
    return { page: "404", params: {}, query };
  }
  function navigate(path) {
    location.hash = "#" + path;
  }

  // src/domains/cosmology.ts
  var cosmologyConfig = {
    id: "cosmology",
    name: "Cosmology",
    namePlural: "Celestial Bodies",
    icon: "star",
    color: "#e8c547",
    description: "Define the stars, planets, moons, and other celestial bodies that make up your world's universe. Establish orbital mechanics, creation myths, and the structure of the cosmos.",
    tableName: "celestial_bodies",
    category: "natural",
    fields: [
      {
        name: "body_type",
        label: "Body Type",
        type: "select",
        required: true,
        options: ["star", "planet", "moon", "asteroid", "ring", "comet", "nebula"],
        helpText: "The classification of this celestial body."
      },
      {
        name: "composition",
        label: "Composition",
        type: "select",
        options: ["rocky", "gas_giant", "ice_giant", "metallic", "plasma", "mixed", "energy", "unknown"],
        helpText: "The primary material composition of this celestial body."
      },
      {
        name: "mass",
        label: "Mass",
        type: "text",
        placeholder: "e.g. 1.0 solar masses, 5.97e24 kg",
        helpText: "Mass of the body in your preferred units."
      },
      {
        name: "radius",
        label: "Radius",
        type: "text",
        placeholder: "e.g. 6,371 km",
        helpText: "Mean radius of the body."
      },
      {
        name: "orbital_period",
        label: "Orbital Period",
        type: "text",
        placeholder: "e.g. 365.25 days",
        helpText: "Time to complete one orbit around its parent body."
      },
      {
        name: "orbital_parent_id",
        label: "Orbital Parent",
        type: "text",
        placeholder: "ID of the body this orbits",
        helpText: "The celestial body this object orbits around."
      },
      {
        name: "axial_tilt",
        label: "Axial Tilt",
        type: "text",
        placeholder: "e.g. 23.4\xB0",
        helpText: "Tilt of the rotational axis, which affects seasons."
      },
      {
        name: "day_length",
        label: "Day Length",
        type: "text",
        placeholder: "e.g. 24 hours",
        helpText: "Duration of one full rotation."
      },
      {
        name: "surface_gravity",
        label: "Surface Gravity",
        type: "text",
        placeholder: "e.g. 9.8 m/s\xB2",
        helpText: "Gravitational pull at the surface."
      },
      {
        name: "luminosity",
        label: "Luminosity",
        type: "text",
        placeholder: "e.g. 1.0 solar luminosities",
        helpText: "Total energy output (primarily for stars)."
      },
      {
        name: "atmosphere_description",
        label: "Atmosphere Description",
        type: "textarea",
        placeholder: "Describe the atmosphere, if any...",
        helpText: "A brief description of the atmospheric composition and conditions."
      }
    ],
    elementTypes: ["star", "planet", "moon", "asteroid", "comet", "ring_system", "nebula"],
    elementTypeDescriptions: {
      star: "A luminous sphere of plasma held together by gravity, generating light and heat through nuclear fusion. The anchor of a planetary system.",
      planet: "A large body orbiting a star, massive enough for gravity to shape it into a sphere. May be rocky, gaseous, or something stranger.",
      moon: "A natural satellite orbiting a planet. Moons influence tides, stabilize axial tilt, and may harbor life of their own.",
      asteroid: "A small, irregular rocky or metallic body orbiting a star. Often found in belts, and a source of rare minerals.",
      comet: "An icy body that develops a glowing tail of gas and dust when it approaches a star. Often carries mythological significance.",
      ring_system: "A disc of particles \u2014 ice, rock, or dust \u2014 orbiting a planet. Visible from the surface as luminous arcs across the sky.",
      nebula: "A vast cloud of gas and dust in interstellar space, often a stellar nursery where new stars are born."
    },
    prompts: [
      "How many suns does your world orbit? Does the star system have unusual properties that affect life?",
      "What do the night skies look like? Are there multiple moons, visible planets, or permanent celestial features?",
      "How do the orbital mechanics of your world create seasons, tides, and day/night cycles?",
      "What creation myths do the inhabitants tell about the origin of the cosmos?",
      "Are there any celestial events (eclipses, conjunctions, comet passages) that hold cultural or practical significance?"
    ],
    magicPermeation: {
      companionTable: "cosmology_magic_aspects",
      fields: [
        {
          name: "magical_celestial_bodies",
          label: "Magical Celestial Bodies",
          type: "textarea",
          helpText: "Celestial bodies with inherent magical properties or significance."
        },
        {
          name: "astral_plane_relationship",
          label: "Astral Plane Relationship",
          type: "textarea",
          helpText: "How this body relates to or overlaps with the astral plane."
        },
        {
          name: "dimensional_cosmology",
          label: "Dimensional Cosmology",
          type: "textarea",
          helpText: "The dimensional structure of the cosmos and how planes layer or intersect."
        },
        {
          name: "cosmic_magic_sources",
          label: "Cosmic Magic Sources",
          type: "textarea",
          helpText: "Sources of magical energy at the cosmic scale (stellar mana, void energy, etc.)."
        },
        {
          name: "celestial_alignments_effects",
          label: "Celestial Alignment Effects",
          type: "textarea",
          helpText: "How alignments of celestial bodies affect magic in the world."
        },
        {
          name: "creation_myth_magical",
          label: "Magical Creation Myth",
          type: "textarea",
          helpText: "The role of magic in the creation of the cosmos."
        },
        {
          name: "cosmic_entities",
          label: "Cosmic Entities",
          type: "textarea",
          helpText: "Beings of cosmic scale that inhabit or influence the celestial realm."
        },
        {
          name: "magic_relevance",
          label: "Magic Relevance",
          type: "select",
          options: ["none", "minor", "moderate", "major", "fundamental"],
          helpText: "How central magic is to the cosmological nature of this body."
        },
        {
          name: "custom_magic_notes",
          label: "Custom Magic Notes",
          type: "textarea",
          placeholder: "Any additional notes about magical aspects...",
          helpText: "Free-form notes on magical properties not covered above."
        }
      ],
      manaSensitivity: "passive",
      planeAware: true,
      prompts: [
        "Do celestial alignments amplify or dampen magical energy? Are there cosmic ley lines between stars?",
        "Is the cosmos itself a magical construct, or did magic arise within it naturally?",
        "Are there cosmic entities\u2014star gods, void beings\u2014whose movements affect the magical tides of your world?"
      ]
    },
    archetypes: [
      {
        id: "habitable_planet",
        name: "Habitable Planet",
        description: "A rocky world in the habitable zone with liquid water and a breathable atmosphere.",
        element_type: "planet",
        summary: "A terrestrial world orbiting within its star's habitable zone",
        fields: {
          body_type: "planet",
          composition: "rocky",
          surface_gravity: "9.8 m/s\xB2",
          axial_tilt: "20-25\xB0",
          day_length: "20-28 hours",
          atmosphere_description: "Nitrogen-oxygen atmosphere capable of supporting complex life. Moderate greenhouse effect maintains stable surface temperatures."
        }
      },
      {
        id: "gas_giant",
        name: "Gas Giant",
        description: "A massive planet with no solid surface, surrounded by swirling bands of cloud.",
        element_type: "planet",
        summary: "A massive gas giant with swirling cloud bands and numerous moons",
        fields: {
          body_type: "planet",
          composition: "gas_giant",
          mass: "~300 Earth masses",
          radius: "~70,000 km",
          day_length: "10-14 hours",
          atmosphere_description: "Thick layers of hydrogen and helium with bands of ammonia and methane clouds. Violent storms rage across the surface."
        }
      },
      {
        id: "red_dwarf_star",
        name: "Red Dwarf Star",
        description: "A small, cool, long-lived star \u2014 the most common type in many universes.",
        element_type: "star",
        summary: "A dim, long-lived red dwarf star",
        fields: {
          body_type: "star",
          composition: "plasma",
          luminosity: "0.01-0.08 solar luminosities",
          mass: "0.1-0.5 solar masses",
          radius: "~200,000 km"
        }
      },
      {
        id: "major_moon",
        name: "Major Moon",
        description: "A large natural satellite, potentially tidally locked and geologically active.",
        element_type: "moon",
        summary: "A large natural satellite with its own geological character",
        fields: {
          body_type: "moon",
          composition: "rocky",
          surface_gravity: "1.6-3.0 m/s\xB2",
          atmosphere_description: "Thin or absent atmosphere, possibly with volcanic outgassing creating temporary local haze."
        }
      },
      {
        id: "dying_god_star",
        name: "Dying God-Star",
        description: "A star that is the smoldering corpse of a dead deity \u2014 still radiating divine energy as it slowly fades.",
        element_type: "star",
        summary: "The remains of a fallen god, burning with fading divine light",
        fields: {
          body_type: "star",
          composition: "energy",
          luminosity: "Erratic \u2014 pulses with divine resonance, brighter during prayer",
          mass: "Impossible to measure; gravitational pull fluctuates with faith",
          atmosphere_description: "The corona is not plasma but luminous ichor \u2014 the divine blood of the dead god. Ships passing through report visions, prophecies, and madness."
        }
      },
      {
        id: "wandering_world",
        name: "Wandering Rogue Planet",
        description: "A planet cast out of its star system, drifting through interstellar void with a frozen surface hiding a warm interior.",
        element_type: "planet",
        summary: "A starless world drifting through the void, warmed only from within",
        fields: {
          body_type: "planet",
          composition: "rocky",
          surface_gravity: "12.5 m/s\xB2",
          luminosity: "None \u2014 no parent star, perpetual darkness on the surface",
          atmosphere_description: "A thick nitrogen atmosphere frozen into surface ice. Geothermal vents create pockets of warmth and breathable air in deep valleys, where eyeless ecosystems thrive."
        }
      },
      {
        id: "binary_stars",
        name: "Binary Star System",
        description: "Two stars orbiting each other, creating complex seasons, double shadows, and competing gravitational fields.",
        element_type: "star",
        summary: "A pair of stars locked in mutual orbit, bathing their worlds in shifting double light",
        detailed_notes: "Binary star systems produce extraordinary environmental complexity. Planets in such systems experience variable day lengths, overlapping light spectra, and seasons driven by the relative positions of both stars. Shadows are always doubled, and twilight can last for hours as one star sets while the other remains. Civilizations here develop dual calendars, and the interplay of gravitational fields creates unusual tidal forces on any orbiting worlds.",
        fields: {
          body_type: "star",
          composition: "plasma",
          mass: "Primary: 1.1 solar masses, Secondary: 0.8 solar masses",
          luminosity: "Combined: 2.4 solar luminosities, shifting as orbital distance varies",
          orbital_period: "80 years mutual orbit; inner planets experience complex multi-year light cycles"
        }
      },
      {
        id: "hollow_world",
        name: "Hollow World",
        description: "A planet that is hollow inside, with an interior surface, inner sun, and inverted horizon.",
        element_type: "planet",
        summary: "A world with a habitable interior surface curving upward in every direction",
        detailed_notes: "The hollow world defies conventional physics \u2014 its inner surface is habitable, lit by a small, perpetual light source at the core. Gravity pulls toward the shell from both sides, allowing life on the outer and inner surfaces. The interior sky is the land itself, curving upward until it vanishes in atmospheric haze. There is no true horizon; instead, distant lands arc overhead. Navigation relies on the inner sun's position, and weather systems spiral in inverted patterns. Civilizations on the interior may be entirely unaware of the exterior world, and vice versa.",
        fields: {
          body_type: "planet",
          composition: "rocky",
          surface_gravity: "7.2 m/s\xB2 on outer surface, 6.8 m/s\xB2 on inner surface",
          atmosphere_description: "The interior atmosphere is denser and warmer than the exterior, trapped by the shell. Clouds form at the midpoint between the inner surface and the core sun, creating a permanent band of weather. Light diffuses evenly, so the interior knows no night \u2014 only dimming when the core sun pulses."
        }
      },
      {
        id: "crystal_sphere",
        name: "Crystal Sphere",
        description: "The cosmos enclosed in a literal crystalline shell \u2014 the stars are imperfections in the crystal, and the edge of the universe is a wall you can touch.",
        element_type: "nebula",
        summary: "A finite universe bounded by a crystalline firmament, with stars as flaws in the shell",
        detailed_notes: "In this cosmology, the universe is not infinite but enclosed within an immense sphere of translucent crystal. What appear to be stars are actually cracks, inclusions, and imperfections in the crystal that allow light from whatever lies beyond to leak through. The sphere rotates slowly, which is why the stars appear to move. Expeditions to reach the edge have returned with fragments of the crystal \u2014 a material harder than diamond that hums with residual energy. Theologians debate whether the sphere is a prison, a womb, or a lens. The largest crack in the sphere is visible as a nebula-like smear of light, and it appears to be growing.",
        fields: {
          composition: "unknown",
          atmosphere_description: "Near the crystal boundary, the atmosphere thins to nothing \u2014 but the crystal itself radiates a faint warmth. Explorers report a low harmonic vibration audible in the silence of near-vacuum, as though the sphere is resonating. Dust and debris accumulate against the inner surface, forming a shell of dead comets and lost ships."
        }
      },
      {
        id: "dyson_sphere",
        name: "Dyson Shell",
        description: "A star enclosed in an artificial shell \u2014 civilizations live on the inner surface. Sci-fi cosmology.",
        element_type: "planet",
        summary: "An artificial megastructure enclosing a star, with civilizations inhabiting the inner surface",
        detailed_notes: `The Dyson Shell is the ultimate expression of a civilization's mastery over stellar engineering. An entire star has been enclosed within a rigid artificial sphere, capturing all of its radiant energy. The inner surface \u2014 incomprehensibly vast \u2014 is habitable, lit by the captive sun at the center. Gravity is simulated through rotation or technological means. Entire continents, oceans, and mountain ranges have been constructed on the interior, and populations numbering in the trillions live their lives unaware that their "sky" is a sun and their "ground" curves upward in every direction. The shell's exterior is dark and cold, visible from outside only as a void where a star used to be. The engineering challenges are staggering: structural integrity, heat dissipation, and the sheer material required suggest a civilization that dismantled every planet in the system to build their shell.`,
        fields: {
          body_type: "planet",
          composition: "metallic",
          surface_gravity: "9.8 m/s\xB2 (artificially maintained)",
          atmosphere_description: "Engineered nitrogen-oxygen atmosphere contained by the shell. Weather systems are partially artificial, managed by climate engines embedded in the shell structure. The sky is dominated by the enclosed star, which never sets \u2014 day and night are simulated by massive orbiting shades."
        }
      },
      {
        id: "dream_sun",
        name: "Dream Sun",
        description: "A star that exists only while a god sleeps. If the god wakes, the star vanishes and the world goes dark.",
        element_type: "star",
        summary: "A star sustained by the slumber of a dreaming deity \u2014 fragile, sacred, and terrifying in its impermanence",
        detailed_notes: "The Dream Sun is not a ball of plasma held together by gravity and fusion. It is a thought \u2014 a radiant dream burning in the mind of a sleeping god. As long as the god slumbers, the sun blazes in the sky, warming the worlds that orbit it and sustaining all life in the system. But the sun flickers. Sometimes it dims for hours or days, and scholars have correlated these episodes with disturbances near the god's resting place. Entire religions are built around keeping the god asleep: monks chant lullabies that resonate through the divine frequency, assassins eliminate anyone who might cause a disturbance, and heretics who seek to wake the god are hunted with fanatical urgency. The existential terror is absolute \u2014 if the god wakes, the sun winks out, and everything dies. Some philosophers wonder what the god dreams of, and whether the world itself is part of that dream.",
        fields: {
          body_type: "star",
          composition: "energy",
          luminosity: "Variable \u2014 dims during the god's restless episodes, brightens during deep sleep. Average output approximately 1.0 solar luminosities."
        }
      },
      {
        id: "shattered_moon",
        name: "Shattered Moon",
        description: "A moon broken into orbiting fragments. The debris ring creates spectacular night skies and periodic meteor showers.",
        element_type: "moon",
        summary: "The remnants of a destroyed moon, now a glittering ring of debris producing spectacular meteor showers",
        detailed_notes: "Something destroyed the moon. Whether it was a cosmic impact, a weapons test by a forgotten civilization, or the wrath of a deity, the result is the same: where a solid moon once orbited, there is now a slowly dispersing cloud of fragments ranging from dust motes to city-sized boulders. The debris has settled into a rough ring around the planet, creating a luminous arc across the night sky that is hauntingly beautiful. Periodically, fragments descend through the atmosphere as meteor showers \u2014 some predictable and celebrated as festivals, others chaotic and destructive. The largest fragments retain enough gravity to be miniature worlds of their own, and some civilizations have established outposts on them. Tidal patterns on the planet below have been permanently disrupted, and coastlines are still adjusting centuries after the shattering.",
        fields: {
          body_type: "moon",
          composition: "rocky",
          orbital_period: "Fragments orbit at varying speeds \u2014 inner debris completes an orbit in 12 days, outer fragments in 45 days. The original moon had a 28-day period."
        }
      }
    ],
    defaultSortField: "body_type"
  };

  // src/domains/geology.ts
  var geologyConfig = {
    id: "geology",
    name: "Geology",
    namePlural: "Geological Features",
    icon: "mountain",
    color: "#a0785a",
    description: "Define the tectonic plates, mountain ranges, volcanoes, cave systems, and mineral deposits that shape your world's terrain. Geology underpins biomes, resources, and civilizations.",
    tableName: "geological_features",
    category: "natural",
    fields: [
      {
        name: "feature_type",
        label: "Feature Type",
        type: "select",
        required: true,
        options: ["mountain_range", "volcano", "canyon", "plain", "cave_system", "fault_line", "crater", "plateau", "island", "rift_valley", "mesa", "fjord", "badlands", "delta"],
        optionDescriptions: {
          mountain_range: "A chain of mountains formed by tectonic collision, volcanism, or magical upheaval. Defines borders, climate barriers, and resource-rich highlands.",
          volcano: "An opening in the crust where magma reaches the surface. May be active, dormant, or extinct \u2014 and a source of fertile soil, minerals, or danger.",
          canyon: "A deep, narrow valley carved by water erosion, tectonic splitting, or catastrophic events. Often reveals exposed geological strata.",
          plain: "A broad, flat expanse of land with minimal elevation change. Ideal for agriculture, large settlements, and overland travel.",
          cave_system: "Underground networks of chambers and passages formed by water dissolution, lava tubes, or subterranean forces. May host hidden ecosystems or civilizations.",
          fault_line: "A fracture in the crust where tectonic plates meet and shift. Source of earthquakes, geothermal activity, and geological instability.",
          crater: "A bowl-shaped depression formed by meteorite impact, volcanic collapse, or magical detonation. May contain lakes, settlements, or unusual mineral deposits.",
          plateau: "An elevated flat-topped landform rising sharply above surrounding terrain. Often isolated, defensible, and climatically distinct from lowlands.",
          island: "A body of land surrounded by water, formed by volcanism, tectonic uplift, or continental separation. Develops unique ecosystems through isolation.",
          rift_valley: "A long, narrow depression where the crust is being pulled apart. Sites of volcanic activity, hot springs, and early civilizations along fertile lakeshores.",
          mesa: "A flat-topped hill with steep sides, an erosion remnant of a former plateau. Often sacred or strategically significant due to their natural fortification.",
          fjord: "A narrow, deep coastal inlet carved by glacial erosion. Steep-walled and sheltered, fjords make natural harbors and dramatic landscapes.",
          badlands: "Heavily eroded terrain of ridges, gullies, and hoodoos with sparse vegetation. Difficult to traverse but rich in exposed fossils and minerals.",
          delta: "A fan-shaped deposit of sediment where a river meets a larger body of water. Among the most fertile and densely populated landforms."
        },
        helpText: "The geological classification of this feature."
      },
      {
        name: "elevation_min",
        label: "Minimum Elevation",
        type: "number",
        placeholder: "Meters above/below sea level",
        helpText: "The lowest point of this feature in meters."
      },
      {
        name: "elevation_max",
        label: "Maximum Elevation",
        type: "number",
        placeholder: "Meters above sea level",
        helpText: "The highest point of this feature in meters."
      },
      {
        name: "age_description",
        label: "Geological Age",
        type: "text",
        placeholder: "e.g. 300 million years, ancient, newly formed",
        helpText: "How old this feature is in your world's timeline."
      },
      {
        name: "mineral_composition",
        label: "Mineral Composition",
        type: "json",
        placeholder: '["granite", "quartz", "obsidian"]',
        helpText: "Notable minerals and materials found in this feature."
      },
      {
        name: "tectonic_plate",
        label: "Tectonic Plate",
        type: "text",
        placeholder: "Name of the tectonic plate",
        helpText: "Which tectonic plate this feature sits on or borders."
      },
      {
        name: "active",
        label: "Geologically Active",
        type: "boolean",
        helpText: "Whether this feature is still geologically active (volcanic, seismic, etc.)."
      },
      {
        name: "formation_process",
        label: "Formation Process",
        type: "textarea",
        placeholder: "Describe how this feature was formed \u2014 tectonic collision, erosion, volcanic eruption, magical cataclysm...",
        helpText: "The geological or supernatural forces that created this feature and over what timescale."
      },
      {
        name: "natural_resources",
        label: "Natural Resources",
        type: "textarea",
        placeholder: "Describe ore veins, gemstone deposits, quarry stone, fossil fuels...",
        helpText: "Extractable resources found in or around this feature \u2014 drives mining economies and settlement."
      },
      {
        name: "geographic_extent",
        label: "Geographic Extent",
        type: "text",
        placeholder: "e.g. 800 km long, 50 km\xB2 area, 3 km deep",
        helpText: "The lateral size, length, or area of this feature."
      },
      {
        name: "hazards",
        label: "Geological Hazards",
        type: "textarea",
        placeholder: "Describe earthquakes, eruptions, landslides, sinkholes, toxic gas vents...",
        helpText: "Active dangers posed by this feature \u2014 seismic events, eruptions, collapses, toxic emissions."
      },
      {
        name: "climate_impact",
        label: "Climate Impact",
        type: "textarea",
        placeholder: "Describe rain shadows, wind barriers, temperature effects...",
        helpText: "How this feature shapes the climate of surrounding regions \u2014 rain shadows, wind deflection, thermal effects."
      }
    ],
    elementTypes: ["mountain_range", "volcano", "canyon", "plain", "cave_system", "fault_line", "crater", "plateau", "island", "rift_valley", "mesa", "fjord", "badlands", "delta"],
    elementTypeDescriptions: {
      mountain_range: "A chain of mountains formed by tectonic collision or volcanism. Defines borders, creates rain shadows, and holds mineral wealth.",
      volcano: "An opening in the crust where magma reaches the surface. May be active, dormant, or extinct \u2014 a source of fertile soil and danger alike.",
      canyon: "A deep, narrow valley carved by water erosion or tectonic splitting, often revealing exposed geological strata.",
      plain: "A broad, flat expanse of land with minimal elevation change. Ideal for agriculture, settlements, and overland travel.",
      cave_system: "Underground networks of chambers and passages formed by water dissolution, lava tubes, or subterranean forces.",
      fault_line: "A fracture in the crust where tectonic plates meet and shift. Source of earthquakes, geothermal activity, and instability.",
      crater: "A bowl-shaped depression formed by meteorite impact, volcanic collapse, or magical detonation.",
      plateau: "An elevated flat-topped landform rising sharply above surrounding terrain. Often isolated and climatically distinct.",
      island: "A body of land surrounded by water, formed by volcanism or tectonic uplift. Develops unique ecosystems through isolation.",
      rift_valley: "A long depression where the crust is being pulled apart. Sites of volcanic activity and hot springs.",
      mesa: "A flat-topped hill with steep sides, an erosion remnant of a former plateau. Naturally defensible and often sacred.",
      fjord: "A narrow, deep coastal inlet carved by glacial erosion. Steep-walled and sheltered, making natural harbors.",
      badlands: "Heavily eroded terrain of ridges, gullies, and hoodoos with sparse vegetation. Rich in exposed fossils and minerals.",
      delta: "A fan-shaped deposit of sediment where a river meets a larger body of water. Among the most fertile landforms."
    },
    prompts: [
      "What tectonic forces shaped your world? Are plates still moving, or has the crust stabilized?",
      "Are there unique minerals or geological materials that don't exist in our world? What properties do they have?",
      "How do cave systems and underground features connect? Are there entire civilizations beneath the surface?",
      "What geological disasters (earthquakes, volcanic eruptions, sinkholes) threaten or shape societies?",
      "How has erosion, glaciation, or other long-term processes sculpted the landscape over millennia?"
    ],
    magicPermeation: {
      companionTable: "geology_magic_aspects",
      fields: [
        {
          name: "ley_line_geology",
          label: "Ley Line Geology",
          type: "textarea",
          helpText: "How ley lines interact with geological structures\u2014do they follow fault lines, mineral veins, or mountain roots?"
        },
        {
          name: "magical_minerals",
          label: "Magical Minerals",
          type: "textarea",
          helpText: "Minerals with magical properties found within this feature."
        },
        {
          name: "mana_crystallized_formations",
          label: "Mana-Crystallized Formations",
          type: "textarea",
          helpText: "Geological formations created by or infused with crystallized mana."
        },
        {
          name: "tectonic_magic_interaction",
          label: "Tectonic-Magic Interaction",
          type: "textarea",
          helpText: "How tectonic activity affects or is affected by magical energy."
        },
        {
          name: "underground_mana_reservoirs",
          label: "Underground Mana Reservoirs",
          type: "textarea",
          helpText: "Subterranean pools or veins of concentrated magical energy."
        },
        {
          name: "geological_age_magic_correlation",
          label: "Geological Age & Magic Correlation",
          type: "textarea",
          helpText: "How the age of formations relates to their magical properties."
        },
        {
          name: "volcanic_magic",
          label: "Volcanic Magic",
          type: "textarea",
          helpText: "Magical properties of volcanic activity\u2014eruptions releasing stored mana, lava with magical properties, etc."
        },
        {
          name: "fossil_magic",
          label: "Fossil Magic",
          type: "textarea",
          helpText: "Magical residue in fossils of ancient creatures or plants."
        },
        {
          name: "magic_relevance",
          label: "Magic Relevance",
          type: "select",
          options: ["none", "minor", "moderate", "major", "fundamental"],
          helpText: "How central magic is to this geological feature."
        },
        {
          name: "custom_magic_notes",
          label: "Custom Magic Notes",
          type: "textarea",
          placeholder: "Any additional notes about magical aspects...",
          helpText: "Free-form notes on magical properties not covered above."
        }
      ],
      manaSensitivity: "passive",
      planeAware: false,
      prompts: [
        "Do ley lines follow geological fault lines, or do they cut through the earth independently? Can mining disrupt them?",
        "Are there minerals that naturally store, conduct, or repel magical energy? How has this shaped mining economies?",
        "When volcanoes erupt, do they release concentrated magical energy along with lava and ash?"
      ]
    },
    archetypes: [
      {
        id: "continental_mountain_range",
        name: "Continental Mountain Range",
        description: "A vast chain of mountains formed by tectonic collision, shaping weather and dividing civilizations.",
        element_type: "mountain_range",
        summary: "A continent-spanning mountain range born from tectonic collision",
        fields: {
          feature_type: "mountain_range",
          elevation_max: 8e3,
          elevation_min: 1500,
          active: true,
          formation_process: "Formed by the collision of two continental plates over millions of years, with ongoing uplift creating jagged peaks and deep valleys.",
          natural_resources: "Rich deposits of iron, copper, gold, and gemstones in the folded rock layers. Alpine meadows provide seasonal grazing.",
          climate_impact: "Creates a major rain shadow effect, with lush forests on the windward side and arid plains on the leeward side."
        }
      },
      {
        id: "shield_volcano",
        name: "Shield Volcano",
        description: "A broad, gently sloping volcano built by successive flows of fluid lava.",
        element_type: "volcano",
        summary: "A broad, active shield volcano with fertile lower slopes",
        fields: {
          feature_type: "volcano",
          elevation_max: 4e3,
          elevation_min: 0,
          active: true,
          formation_process: "Built up over millennia by repeated eruptions of low-viscosity basaltic lava that flows long distances before cooling.",
          natural_resources: "Fertile volcanic soils on the lower slopes support lush agriculture. Obsidian and pumice deposits.",
          hazards: "Slow-moving lava flows that can engulf settlements over days. Occasional explosive eruptions when water infiltrates the magma chamber."
        }
      },
      {
        id: "limestone_cave_network",
        name: "Limestone Cave Network",
        description: "A vast underground system of chambers and passages carved by water through ancient limestone.",
        element_type: "cave_system",
        summary: "An ancient network of limestone caves with underground rivers",
        fields: {
          feature_type: "cave_system",
          active: false,
          age_description: "Tens of millions of years",
          formation_process: "Carved by slightly acidic groundwater dissolving limestone over geological time, creating vast chambers, stalactites, and underground rivers.",
          natural_resources: "Crystal formations, underground freshwater reserves, and rare cave-adapted minerals. Guano deposits from bat colonies."
        }
      },
      {
        id: "rift_valley",
        name: "Rift Valley",
        description: "A dramatic depression where the earth's crust is pulling apart, often geothermally active.",
        element_type: "rift_valley",
        summary: "A tectonic rift valley with geothermal springs and volcanic activity",
        fields: {
          feature_type: "rift_valley",
          elevation_min: -200,
          elevation_max: 800,
          active: true,
          formation_process: "Created by extensional tectonic forces pulling the crust apart, causing the central block to drop between parallel fault lines.",
          natural_resources: "Geothermal energy, alkaline lakes rich in minerals, and fertile volcanic soils along the valley floor.",
          hazards: "Frequent seismic activity, volcanic eruptions along the rift margins, and sudden ground subsidence."
        }
      },
      {
        id: "petrified_titan",
        name: "Petrified Titan",
        description: "A mountain range that is actually the fossilized remains of a colossal primordial creature.",
        element_type: "mountain_range",
        summary: "The stone bones of an ancient giant, mistaken for mountains",
        fields: {
          feature_type: "mountain_range",
          elevation_max: 6e3,
          elevation_min: 800,
          active: false,
          age_description: "Older than recorded history \u2014 geological dating gives impossible results",
          formation_process: 'Not geological at all. The "mountains" are the petrified spine and ribcage of a creature so vast it was mistaken for terrain. The truth is preserved in indigenous oral tradition but dismissed by scholars.',
          natural_resources: "Bone-ite \u2014 fossilized titan bone harder than granite. Marrow caverns contain veins of an opalescent mineral found nowhere else. Alchemists pay fortunes for it.",
          hazards: "Sections occasionally shift as if the titan is stirring in its sleep. Earthquakes here follow no tectonic logic."
        }
      },
      {
        id: "floating_islands",
        name: "Floating Islands",
        description: "Masses of rock suspended above the ground by anti-gravity minerals, magical uplift, or gas pockets.",
        element_type: "island",
        summary: "Airborne landmasses hovering above the surface, defying conventional geology",
        detailed_notes: "Floating islands are geological anomalies \u2014 fragments of terrain that have separated from the ground and hang suspended at varying altitudes. The mechanism varies: some are laced with anti-gravity minerals that repel the earth below, others ride on columns of superheated gas from volcanic vents, and still others are held aloft by ancient enchantments embedded in the bedrock. The islands drift slowly, their shadows tracking across the land below like roaming eclipses. Waterfalls pour from their edges into mist, and unique ecosystems develop in isolation. Civilizations build bridges of chain and rope between island clusters, and wars have been fought over the richest mineral-bearing floaters.",
        fields: {
          feature_type: "island",
          elevation_min: 500,
          elevation_max: 4e3,
          formation_process: "Torn from the surface by concentrations of anti-gravity minerals (levitite) deposited by ancient volcanic activity. The minerals repel the planetary crust, and once a critical mass is reached, the surrounding rock shears free and rises until equilibrium is reached.",
          mineral_composition: '["levitite", "basalt", "quartz", "iron ore", "sky-moss calcite"]',
          hazards: "Islands occasionally lose buoyancy and crash to the ground without warning. Edge erosion sends rockfalls thousands of meters to the surface. High winds make crossing between islands lethal without secured lines."
        }
      },
      {
        id: "glass_desert",
        name: "Glass Desert",
        description: "A vast plain of fused silica created by an ancient magical detonation or meteorite impact.",
        element_type: "plain",
        summary: "An endless expanse of fused glass \u2014 beautiful, blinding, and mercilessly hot",
        detailed_notes: "The glass desert is what remains when unimaginable heat is applied to a sandy plain \u2014 the entire surface fused into a single sheet of silica glass stretching to the horizon. The surface is smooth in some places and fractured into jagged shards in others. During the day, sunlight reflects with blinding intensity, and the surface temperature can melt boot leather. At night, the glass cools rapidly and contracts, producing eerie cracking sounds that carry for miles. Beneath the glass layer, pockets of trapped air and sand create hollow chambers that collapse unpredictably. The event that created it \u2014 whether a meteor strike, a magical detonation, or a divine punishment \u2014 is a matter of fierce scholarly debate. Nothing grows on the surface, but hardy organisms survive in the cracks and beneath the glass crust.",
        fields: {
          feature_type: "plain",
          elevation_min: 200,
          formation_process: "Created by a cataclysmic thermal event approximately 3,000 years ago that fused the sand of a vast desert into a continuous sheet of glass. The heat signature suggests temperatures exceeding 3,000\xB0C sustained for several minutes across an area of 40,000 km\xB2.",
          mineral_composition: '["fused silica", "fulgurite veins", "trinitite-analog", "obsidian nodules"]',
          hazards: "Blinding reflected sunlight causes snow-blindness within minutes without eye protection. Surface temperatures reach 70\xB0C at midday. The glass crust is brittle in places and collapses into subsurface voids. Sharp edges lacerate exposed skin and shred footwear.",
          climate_impact: "The highly reflective surface creates a local albedo anomaly, deflecting heat upward and generating powerful thermals. Surrounding regions experience unusual wind patterns and reduced rainfall as moisture-laden air is pushed away by rising hot air columns."
        }
      },
      {
        id: "living_mountain",
        name: "Living Mountain",
        description: "A geological feature that is actually a dormant or sleeping creature of immense size.",
        element_type: "mountain_range",
        summary: "A mountain that breathes \u2014 a slumbering titan mistaken for terrain",
        detailed_notes: `Unlike the petrified titan, the living mountain is not dead \u2014 it is sleeping. The "mountain" is the curled body of a creature so enormous that forests grow on its back and rivers run through the creases of its skin. Its breathing cycle spans decades: a slow inhale that lasts years, followed by an equally gradual exhale that changes wind patterns across the region. Geological surveys reveal that the rock is not rock at all but a keratinous hide covered in mineral deposits accumulated over millennia of stillness. The creature's heartbeat is detectable as a deep, rhythmic tremor every 72 hours. Entire civilizations have been built on its surface, unaware that their homeland is alive. The question that terrifies scholars is not whether it will wake \u2014 but what could possibly have put it to sleep, and whether that force is still in effect.`,
        fields: {
          feature_type: "mountain_range",
          elevation_max: 5500,
          active: true,
          formation_process: 'Not formed by geology. The "mountain" is a living organism of unknown origin that settled into its current position in prehistory and entered a dormant state. Mineral accretion over millennia gave it the appearance of natural terrain.',
          hazards: "Periodic tremors from the creature's heartbeat cause structural damage to settlements. Excavation too deep risks piercing the hide and triggering a pain response. If it wakes, everything built upon it will be destroyed."
        }
      },
      {
        id: "bone_fields",
        name: "Bone Fields",
        description: "A plain made of compressed ancient bones. Fossils, ancient marrow, and opalescent mineral deposits.",
        element_type: "plain",
        summary: "A vast plain of compressed prehistoric bones \u2014 eerily flat, phosphorescent at night, and rich with strange minerals",
        detailed_notes: "The Bone Fields are what remains after millions of years of death accumulation in a low basin that once served as a natural trap for megafauna. Over geological time, the bones compressed into a dense, pale stratum that now forms the surface layer across thousands of square kilometers. The terrain is unnervingly flat and white, broken only by occasional ridges where larger skeletal elements \u2014 ribs, skulls, femurs of creatures long extinct \u2014 protrude from the surface like abstract monuments. At night, phosphorescent minerals in the ancient marrow cause sections of the plain to glow with a faint blue-green light. The soil is extraordinarily rich in calcium and phosphorus, and opalescent deposits formed from mineralized marrow are prized by jewelers and alchemists. Despite its macabre composition, the Bone Fields support a unique ecosystem of calcium-tolerant grasses, burrowing insects, and scavenging birds that feed on the fossil-dwelling invertebrates.",
        fields: {
          feature_type: "plain",
          formation_process: "Millions of years of megafaunal die-offs in a natural basin, followed by compression and mineralization. The bone layer is 15-30 meters thick in places, representing countless generations of creatures drawn to the basin by water sources that have long since dried up.",
          mineral_composition: '["calcium phosphate", "opalescent marrow-stone", "fossilized keratin", "boneite", "trace rare earth elements"]',
          natural_resources: "Opal-marrow gemstones, high-grade calcium phosphate for fertilizer and alchemy, fossilized keratin harder than steel, and rare earth elements concentrated by biological processes over millions of years.",
          hazards: 'The bone substrate is riddled with cavities and hollow chambers that collapse under heavy loads. Dust storms whip up bone powder that causes a choking respiratory illness called "marrow lung." At night, the phosphorescent glow attracts disoriented travelers into unmarked sinkholes.'
        }
      },
      {
        id: "singing_stones",
        name: "Singing Stones",
        description: "Rock formations that resonate at specific frequencies, producing sound audible for miles.",
        element_type: "mountain_range",
        summary: "A mountain range of crystalline rock that produces haunting, resonant tones when wind or seismic activity passes through it",
        detailed_notes: "The Singing Stones are a mountain range composed primarily of a rare piezoelectric mineral that converts mechanical stress into sound. When wind passes through the narrow canyons and eroded columns, the rock vibrates at precise frequencies, producing tones that range from deep, bone-shaking bass to high, crystalline notes audible for dozens of miles. Seismic activity triggers even more dramatic performances \u2014 an earthquake in the Singing Stones produces a chorus that can be heard across entire continents. The acoustic properties have made the range sacred to every culture within earshot. Temples are built at nodes where multiple resonant formations converge, producing permanent harmonies. Miners work the range carefully, because removing the wrong formation can silence an entire valley's song \u2014 or worse, create a dissonant frequency that causes headaches, nausea, and madness in nearby settlements.",
        fields: {
          feature_type: "mountain_range",
          elevation_max: 4500,
          mineral_composition: '["piezoelectric quartz", "resonance crystal", "basalt", "granite", "sound-stone"]',
          formation_process: "Formed by volcanic intrusion of silica-rich magma into existing limestone, creating veins of piezoelectric crystal that were later exposed by erosion. The specific geometry of the eroded formations \u2014 columns, arches, and tubes \u2014 amplifies the piezoelectric vibrations into audible sound."
        }
      },
      {
        id: "scar_of_god",
        name: "Scar of God",
        description: "A canyon or crater left by a divine weapon strike. Still radiates power millennia later.",
        element_type: "crater",
        summary: "A wound in the earth left by the strike of a divine weapon, still radiating residual power after millennia",
        detailed_notes: "The Scar of God is not a natural geological formation. It is a wound \u2014 a gash in the crust of the world left by the strike of a weapon wielded by a deity during a war among gods. The crater is roughly 80 kilometers long and 15 kilometers wide, tapering to a point at each end as though the earth were slashed by a colossal blade. The walls are fused glass, the impact having vitrified the rock instantaneously. At the deepest point, the crater breaches the mantle, and a lake of slowly cooling magma still glows at the bottom, thousands of years after the strike. The residual divine energy is palpable \u2014 compasses spin, animals refuse to enter, and those who spend too long at the rim report visions of the battle that created it. The Scar has never healed. Geologists note that the surrounding crust is still recoiling from the impact, producing earthquakes that follow no natural pattern. Some theologians believe the wound is infected \u2014 that something fell into the breach during the divine war and is still down there, festering.",
        fields: {
          feature_type: "crater",
          elevation_min: -8e3,
          formation_process: "Created by the strike of a divine weapon during a war among gods. The impact vitrified rock, breached the mantle, and left residual divine energy that prevents natural geological healing. The strike is dated to approximately 8,000 years ago by fused-glass analysis.",
          hazards: "Residual divine energy disrupts navigation, induces hallucinations, and causes temporal distortion near the crater floor. The exposed magma lake produces toxic gases. Earthquakes centered on the Scar follow no tectonic logic and cannot be predicted. Expeditions to the crater floor have a low survival rate.",
          climate_impact: "The exposed magma lake creates a permanent thermal updraft that disrupts weather patterns for hundreds of miles. A column of superheated air rises from the Scar, deflecting storm systems and creating a rain shadow in regions that would otherwise be fertile. Ash from the magma lake occasionally enters the upper atmosphere during seismic events."
        }
      }
    ],
    defaultSortField: "feature_type"
  };

  // src/domains/hydrology.ts
  var hydrologyConfig = {
    id: "hydrology",
    name: "Hydrology",
    namePlural: "Water Bodies",
    icon: "droplet",
    color: "#4a9eff",
    description: "Map the oceans, rivers, lakes, glaciers, and aquifers of your world. Water shapes civilizations, trade routes, and ecosystems in fundamental ways.",
    tableName: "water_bodies",
    category: "natural",
    fields: [
      {
        name: "water_type",
        label: "Water Type",
        type: "select",
        required: true,
        options: ["ocean", "sea", "lake", "river", "glacier", "aquifer", "swamp", "hot_spring", "estuary", "geyser", "spring", "reef"],
        helpText: "The classification of this water body."
      },
      {
        name: "volume",
        label: "Volume",
        type: "text",
        placeholder: "e.g. 1.335 billion km\xB3",
        helpText: "Approximate volume of water contained."
      },
      {
        name: "salinity",
        label: "Salinity",
        type: "text",
        placeholder: "e.g. 35 ppt (parts per thousand)",
        helpText: "Salt concentration\u2014fresh, brackish, or salt water."
      },
      {
        name: "depth_max",
        label: "Maximum Depth",
        type: "number",
        placeholder: "Meters",
        helpText: "The deepest point of this water body in meters."
      },
      {
        name: "flow_direction",
        label: "Flow Direction",
        type: "text",
        placeholder: "e.g. North to South, circular current",
        helpText: "Primary direction of flow or current patterns."
      },
      {
        name: "temperature_range",
        label: "Temperature Range",
        type: "text",
        placeholder: "e.g. 2\xB0C - 28\xB0C",
        helpText: "Typical water temperature range across seasons."
      },
      {
        name: "water_quality",
        label: "Water Quality",
        type: "textarea",
        placeholder: "Describe clarity, purity, drinkability, pollutants...",
        helpText: "The quality, clarity, and potability of the water \u2014 important for ecosystems and settlements."
      },
      {
        name: "connected_to",
        label: "Connected Water Bodies",
        type: "json",
        placeholder: '["River Aelith", "Sea of Storms"]',
        helpText: "Other water bodies this one flows into or connects with."
      }
    ],
    elementTypes: ["ocean", "sea", "lake", "river", "glacier", "aquifer", "swamp", "hot_spring", "waterfall"],
    elementTypeDescriptions: {
      ocean: "A vast body of saltwater covering a major portion of a world's surface. Drives climate, enables trade, and harbors deep mysteries.",
      sea: "A smaller body of saltwater, often partially enclosed by land. More navigable than oceans, and central to coastal civilizations.",
      lake: "A body of standing water surrounded by land, fed by rivers, rain, or underground springs. Fresh or salt, shallow or abyssal.",
      river: "A flowing body of freshwater following gravity from high ground to a larger body of water. The lifeline of civilizations.",
      glacier: "A massive, slow-moving body of compressed ice. Carves landscapes over millennia and stores vast quantities of freshwater.",
      aquifer: "An underground layer of rock or sediment that holds and transmits groundwater. The hidden water supply beneath the surface.",
      swamp: "A wetland with standing water and dense vegetation. Rich in biodiversity, difficult to traverse, and often culturally feared.",
      hot_spring: "A geothermally heated pool of water rising from underground. Often mineral-rich, sacred, or home to extremophile life.",
      waterfall: "A point where a river drops vertically over a rock formation. Landmarks of beauty, power, and often spiritual significance."
    },
    prompts: [
      "How does the water cycle work in your world? Are there unusual sources of precipitation or evaporation?",
      "What role do rivers and oceans play in trade, travel, and the spread of civilizations?",
      "Are there bodies of water with unusual properties\u2014colors, densities, or behaviors unlike our world?",
      "How do underground aquifers and water tables affect where settlements can thrive?",
      "What creatures or hazards lurk in the deep waters? Are there unexplored ocean trenches or subterranean rivers?"
    ],
    magicPermeation: {
      companionTable: "hydrology_magic_aspects",
      fields: [
        {
          name: "enchanted_waters",
          label: "Enchanted Waters",
          type: "textarea",
          helpText: "Waters with inherent magical properties\u2014healing springs, cursed lakes, etc."
        },
        {
          name: "mana_springs",
          label: "Mana Springs",
          type: "textarea",
          helpText: "Natural upwellings where mana dissolves into or emerges from water."
        },
        {
          name: "magical_currents",
          label: "Magical Currents",
          type: "textarea",
          helpText: "Currents that carry magical energy, creating paths of power through waterways."
        },
        {
          name: "water_mana_conductivity",
          label: "Water-Mana Conductivity",
          type: "textarea",
          helpText: "How well this water conducts, stores, or resists magical energy."
        },
        {
          name: "tidal_magic_effects",
          label: "Tidal Magic Effects",
          type: "textarea",
          helpText: "How tides (influenced by moons, celestial bodies) affect local magic levels."
        },
        {
          name: "deep_water_magic",
          label: "Deep Water Magic",
          type: "textarea",
          helpText: "Magical phenomena in the deepest parts of this water body."
        },
        {
          name: "purification_corruption",
          label: "Purification & Corruption",
          type: "textarea",
          helpText: "How magic purifies or corrupts the water, and the effects downstream."
        },
        {
          name: "water_elemental_connection",
          label: "Water Elemental Connection",
          type: "textarea",
          helpText: "Relationship to water elementals, spirits, or planar water realms."
        },
        {
          name: "magic_relevance",
          label: "Magic Relevance",
          type: "select",
          options: ["none", "minor", "moderate", "major", "fundamental"],
          helpText: "How central magic is to this water body."
        },
        {
          name: "custom_magic_notes",
          label: "Custom Magic Notes",
          type: "textarea",
          placeholder: "Any additional notes about magical aspects...",
          helpText: "Free-form notes on magical properties not covered above."
        }
      ],
      manaSensitivity: "reactive",
      planeAware: false,
      prompts: [
        "Does water conduct or store magical energy? Can mana dissolve into water like minerals do?",
        "Are there sacred or cursed springs whose waters grant boons or afflictions to those who drink?",
        "How do ocean tides, driven by magical moons, create surges or dead zones of magical power along coastlines?"
      ]
    },
    archetypes: [
      {
        id: "major_ocean",
        name: "Major Ocean",
        description: "A vast body of saltwater covering a significant portion of the world's surface.",
        element_type: "ocean",
        summary: "A vast ocean teeming with marine life and shaping global weather patterns",
        fields: {
          water_type: "ocean",
          salinity: "~35 parts per thousand",
          depth_max: 11e3,
          temperature_range: "-2\xB0C to 30\xB0C depending on depth and latitude",
          water_quality: "Generally clean open waters with diverse marine ecosystems. Coastal areas vary with proximity to settlements and river outflows."
        }
      },
      {
        id: "great_river",
        name: "Great River",
        description: "A major river system that drains a large watershed and serves as a lifeline for civilizations.",
        element_type: "river",
        summary: "A mighty river flowing from highland sources to the sea",
        fields: {
          water_type: "river",
          depth_max: 60,
          temperature_range: "4\xB0C to 28\xB0C seasonally",
          water_quality: "Clear headwaters becoming increasingly silty downstream. Fertile floodplains along the lower reaches support dense agriculture."
        }
      },
      {
        id: "alpine_lake",
        name: "Alpine Lake",
        description: "A deep, cold, crystal-clear lake fed by mountain snowmelt and glacial runoff.",
        element_type: "lake",
        summary: "A deep mountain lake fed by glacial meltwater",
        fields: {
          water_type: "lake",
          salinity: "Freshwater",
          depth_max: 300,
          temperature_range: "2\xB0C to 15\xB0C",
          water_quality: "Exceptionally clear due to low nutrient content and cold temperatures. Oligotrophic waters support specialized cold-adapted species."
        }
      },
      {
        id: "coastal_wetlands",
        name: "Coastal Wetlands",
        description: "A tidal marshland where freshwater rivers meet the sea, rich with life.",
        element_type: "swamp",
        summary: "Tidal wetlands teeming with birds, fish, and shellfish",
        fields: {
          water_type: "estuary",
          salinity: "Brackish, varying with tides (5-25 ppt)",
          depth_max: 3,
          temperature_range: "10\xB0C to 30\xB0C seasonally",
          water_quality: "Nutrient-rich waters support dense vegetation and serve as critical nursery habitat for marine species. Natural water filtration."
        }
      },
      {
        id: "memory_river",
        name: "Memory River",
        description: "A river whose waters carry dissolved memories \u2014 drink from it and experience fragments of the past.",
        element_type: "river",
        summary: "A river saturated with the memories of everything that has lived along its banks",
        fields: {
          water_type: "river",
          depth_max: 15,
          temperature_range: "Unnaturally constant at 18\xB0C regardless of season",
          water_quality: "Crystal clear but faintly luminescent at night. Fish in the river display uncanny intelligence. Settlements along its banks report shared dreams and d\xE9j\xE0 vu. Long-term exposure causes difficulty distinguishing personal memories from absorbed ones."
        }
      },
      {
        id: "underground_ocean",
        name: "Underground Ocean",
        description: "A vast body of water in a subterranean cavern, with its own tides, currents, and blind ecosystems.",
        element_type: "ocean",
        summary: "A hidden ocean beneath the earth, vast enough to have its own weather and tides",
        detailed_notes: "Miles below the surface, past layers of rock and the roots of mountains, lies an ocean no smaller than the seas above. Its cavern ceiling is so high it vanishes into darkness, and its far shores have never been mapped. The water is warmed from below by geothermal vents, creating a habitable if lightless environment. Bioluminescent organisms provide the only illumination \u2014 ghostly blue and green glows that shift with the currents. The ocean has its own tidal system, driven not by moons but by the rhythmic expansion and contraction of the cavern itself as tectonic pressures shift. Blind leviathans patrol the deep, navigating by echolocation and pressure sense. Surface civilizations who have discovered access points treat them as closely guarded secrets, for the underground ocean connects distant continents through subterranean channels.",
        fields: {
          water_type: "ocean",
          salinity: "28 ppt \u2014 less salty than surface oceans due to constant freshwater seepage through rock",
          depth_max: 8e3,
          temperature_range: "4\xB0C in open water to 90\xB0C near geothermal vents",
          water_quality: "Mineral-rich and slightly acidic from dissolved limestone. Clear in open water but clouded near vent fields by mineral precipitation. Undrinkable without treatment due to heavy mineral content, but supports a thriving chemosynthetic food chain."
        }
      },
      {
        id: "blood_sea",
        name: "Blood Tide Sea",
        description: "A sea with red water from dissolved minerals, iron-rich algae, or ancient magical contamination.",
        element_type: "sea",
        summary: "A crimson sea whose waters run red from iron, algae, and ancient sorcery",
        detailed_notes: "The Blood Tide Sea is named for its unsettling color \u2014 a deep, opaque red that ranges from arterial scarlet near the coast to dark maroon in the deep. The color comes from a convergence of factors: iron-rich mineral runoff from surrounding red sandstone cliffs, a dominant species of crimson algae that thrives in the iron-saturated water, and \u2014 according to local tradition \u2014 the residual taint of a magical war fought over its waters millennia ago. The sea stains anything it touches: ships return to port with red-streaked hulls, fishermen's nets are permanently dyed, and coastal settlements have a distinctive rust-colored tideline. Despite its alarming appearance, the sea supports a rich ecosystem. The iron content promotes explosive algal growth, which feeds dense schools of fish. However, periodic algal blooms create hypoxic dead zones, and the tides themselves sometimes carry a faint metallic scent that unsettles animals.",
        fields: {
          water_type: "sea",
          salinity: "38 ppt \u2014 higher than average due to mineral concentration",
          depth_max: 2200,
          temperature_range: "12\xB0C to 26\xB0C, with warm iron-rich upwellings creating local hot spots",
          water_quality: "Heavily colored but not toxic \u2014 the red tint is primarily biological and mineral. High iron content makes it unsuitable for drinking or irrigation without filtration. Fish caught here have reddish flesh and a faintly metallic taste prized in some cuisines and avoided in others."
        }
      },
      {
        id: "frozen_highway",
        name: "Frozen River Highway",
        description: "A permanently frozen river used as a road by civilizations \u2014 a highway of ice connecting distant settlements.",
        element_type: "glacier",
        summary: "A river frozen solid year-round, serving as the primary road between distant settlements",
        detailed_notes: "The Frozen Highway is a river that has not flowed in living memory. Its surface is a smooth, durable sheet of ice thick enough to support caravan traffic, siege engines, and even permanent waystation structures built directly on the frozen surface. The river's original course carved a natural path through otherwise impassable mountain terrain, and when it froze \u2014 whether from climate shift, magical curse, or the death of whatever geothermal source once warmed it \u2014 the ice-road it left behind became the only viable route between the settlements on either end. The ice is not ordinary: it does not melt even in summer, and its surface regenerates from scratches and ruts over a period of weeks. Beneath the transparent upper layer, the dark shapes of the original river's fish can be seen, frozen mid-swim in water that turned to ice in an instant. Traders, armies, and pilgrims all share the highway, and a culture of ice-road etiquette has developed over centuries.",
        fields: {
          water_type: "glacier",
          temperature_range: "-40\xB0C to -15\xB0C \u2014 the ice never approaches melting point",
          flow_direction: "None \u2014 permanently frozen. Original flow was east to west through a mountain pass.",
          connected_to: '["Lake Vetharn (eastern terminus)", "The Shattered Delta (western terminus)", "Seven waystation settlements along the route"]'
        }
      },
      {
        id: "time_pool",
        name: "Time Pool",
        description: "A body of water that shows visions of the past or future to those who gaze into it.",
        element_type: "lake",
        summary: "A sacred lake whose still surface reveals visions of other times to those who dare to look",
        detailed_notes: 'The Time Pool is a small, preternaturally still body of water nestled in a location of geological and magical significance \u2014 often a mountain hollow, a cave chamber, or the center of an ancient ruin. Its surface is mirror-smooth at all times, undisturbed by wind, rainfall, or even objects thrown into it (which sink without producing ripples). Those who gaze into the water see not their own reflection but scenes from the past or future \u2014 fragmented, non-linear, and often deeply personal. The visions are not controllable: seekers may see the death of a loved one, the fall of a kingdom, or a moment of no apparent significance that only becomes clear years later. Prolonged gazing is dangerous. Those who stare too long report difficulty distinguishing between present reality and temporal echoes, a condition called "time-sickness" that can become permanent. Cultures that know of Time Pools treat them with reverence and fear, posting guardians to prevent casual use.',
        fields: {
          water_type: "lake",
          depth_max: 12,
          temperature_range: "Constant 4\xB0C regardless of season or ambient temperature",
          water_quality: "Impossibly clear \u2014 the water appears to have no substance at all, as though the lake were a hole in reality. No organisms live in it. Chemical analysis returns contradictory results. It is not potable \u2014 those who drink it experience uncontrollable temporal visions for days."
        }
      },
      {
        id: "acid_lake",
        name: "Acid Lake",
        description: "A lake of corrosive liquid \u2014 natural defense and industrial resource.",
        element_type: "lake",
        summary: "A lake of highly corrosive acid that serves as both natural fortress and industrial resource",
        detailed_notes: "The Acid Lake is a large body of corrosive liquid occupying a volcanic caldera. The acidity is extreme \u2014 approaching pH 0 in the deepest zones \u2014 the result of sustained volcanic outgassing of sulfuric and hydrochloric acids into groundwater that collects in the basin. The lake is visually striking: its surface is a vivid, unnatural green or yellow depending on mineral content and acid concentration, and steaming fumaroles along the shoreline add to the hellish atmosphere. Nothing conventional survives in the lake, though extremophile microorganisms thrive in the shallows and form colorful biofilms along the margins. Despite its hostility, the lake is economically valuable: acidic water is used industrially for ore processing, mineral extraction, and alchemical preparation. Settlements at a safe distance from the shore pump acid through ceramic channels, and the lake serves as a natural moat that makes the caldera nearly impregnable.",
        fields: {
          water_type: "lake",
          salinity: "Not applicable \u2014 dissolved sulfuric and hydrochloric acids at extreme concentration",
          depth_max: 180,
          temperature_range: "45\xB0C to 95\xB0C, heated by volcanic activity beneath the caldera",
          water_quality: "Extremely corrosive, pH 0.5-2.0. Dissolves metal, bone, and organic matter within hours. Produces toxic fumes at the surface. Utterly undrinkable. The surrounding soil is bleached white by acid spray carried on the wind."
        }
      },
      {
        id: "tide_maze",
        name: "Tide Maze",
        description: "A coastal system where passages appear and vanish with the tide.",
        element_type: "swamp",
        summary: "A treacherous coastal labyrinth of channels that shift with every tide, trapping the unwary",
        detailed_notes: "The Tide Maze is a vast coastal wetland where the interaction of extreme tidal ranges, shifting sandbars, and dense mangrove-like vegetation creates a labyrinth that reconfigures itself twice daily. At high tide, the maze is a network of navigable channels winding between islands of vegetation. At low tide, the water drains to reveal a trackless mudflat riddled with quicksand, exposed roots, and stranded marine life. The channels that were passable at high tide become impassable walls of mud and vegetation. Navigating the maze requires intimate knowledge of tidal timing and channel behavior that takes years to acquire \u2014 knowledge jealously guarded by local pilots who charge steep fees. Those who enter without a guide are frequently trapped by a turning tide: channels close behind them, new ones open in unfamiliar directions, and the rising water brings with it predators adapted to hunt in the confusion. The Tide Maze serves as a natural fortress for settlements built on the few permanent high-ground islands within it.",
        fields: {
          water_type: "swamp",
          depth_max: 8,
          temperature_range: "15\xB0C to 28\xB0C, varying with tidal inflow",
          flow_direction: "Reverses entirely with the tide \u2014 inward during flood, outward during ebb. Interior channels create chaotic eddies where opposing flows meet."
        }
      }
    ],
    defaultSortField: "water_type"
  };

  // src/domains/atmosphere.ts
  var atmosphereConfig = {
    id: "atmosphere",
    name: "Atmosphere",
    namePlural: "Atmospheres",
    icon: "wind",
    color: "#7ec8e3",
    description: "Define the gaseous envelopes surrounding your world's celestial bodies. Atmospheric composition, pressure, and phenomena determine what can breathe, what burns, and what flies.",
    tableName: "atmospheres",
    category: "natural",
    fields: [
      {
        name: "composition",
        label: "Atmospheric Composition",
        type: "json",
        placeholder: '{"nitrogen": 78, "oxygen": 21, "argon": 0.9}',
        helpText: "Gas composition as percentages or a descriptive list."
      },
      {
        name: "pressure",
        label: "Surface Pressure",
        type: "text",
        placeholder: "e.g. 1.0 atm, 101.3 kPa",
        helpText: "Atmospheric pressure at the surface."
      },
      {
        name: "breathable",
        label: "Breathable",
        type: "boolean",
        helpText: "Whether the atmosphere can sustain common life forms without aid."
      },
      {
        name: "color",
        label: "Sky Color",
        type: "text",
        placeholder: "e.g. pale blue, amber, violet",
        helpText: "The dominant color of the sky as seen from the surface."
      },
      {
        name: "layers",
        label: "Atmospheric Layers",
        type: "json",
        placeholder: '[{"name": "lower", "altitude": "0-10km", "traits": "breathable"}, ...]',
        helpText: "The distinct layers of the atmosphere and their characteristics."
      },
      {
        name: "wind_systems",
        label: "Wind Systems",
        type: "textarea",
        placeholder: "Describe prevailing winds, jet streams, trade winds...",
        helpText: "Major wind patterns including prevailing winds, jet streams, and seasonal wind shifts."
      },
      {
        name: "weather_patterns",
        label: "Weather Patterns",
        type: "textarea",
        placeholder: "Describe recurring weather systems, storm tracks, monsoons...",
        helpText: "Recurring weather systems and patterns distinct from one-off phenomena."
      },
      {
        name: "phenomena",
        label: "Atmospheric Phenomena",
        type: "json",
        placeholder: '["aurora", "perpetual storms", "floating dust layers"]',
        helpText: "Unusual or notable atmospheric events and features."
      }
    ],
    elementTypes: ["atmospheric_layer", "weather_system", "wind_pattern", "atmospheric_phenomenon"],
    elementTypeDescriptions: {
      atmospheric_layer: "A distinct horizontal zone of the atmosphere defined by temperature, composition, or pressure. Each layer has unique properties.",
      weather_system: "A large-scale pattern of atmospheric conditions \u2014 fronts, pressure systems, or persistent storms that drive regional weather.",
      wind_pattern: "A recurring directional airflow caused by pressure differentials, planetary rotation, or geography. Shapes climate and navigation.",
      atmospheric_phenomenon: "An unusual or notable atmospheric event \u2014 auroras, perpetual storms, luminous clouds, or other spectacles in the sky."
    },
    prompts: [
      "What gases make up the atmosphere? Are there unusual components that create exotic sky colors or chemical reactions?",
      "How does atmospheric pressure vary with altitude? Are there floating islands or organisms at high altitude?",
      "What persistent weather systems define regions\u2014eternal storms, calm doldrums, or walls of wind?",
      "How do wind patterns drive ocean currents, rainfall, and the spread of seeds, spores, or airborne creatures?"
    ],
    magicPermeation: {
      companionTable: "atmosphere_magic_aspects",
      fields: [
        {
          name: "mana_density_in_air",
          label: "Mana Density in Air",
          type: "textarea",
          helpText: "How much ambient mana is suspended in the atmosphere."
        },
        {
          name: "atmospheric_mana_layers",
          label: "Atmospheric Mana Layers",
          type: "textarea",
          helpText: "Stratified layers where mana concentrates or thins at different altitudes."
        },
        {
          name: "arcane_aurora",
          label: "Arcane Aurora",
          type: "textarea",
          helpText: "Visible magical phenomena in the upper atmosphere\u2014mana auroras, spell echoes, etc."
        },
        {
          name: "magical_weather_patterns",
          label: "Magical Weather Patterns",
          type: "textarea",
          helpText: "Weather systems created or influenced by magical energy."
        },
        {
          name: "air_magic_conductivity",
          label: "Air-Magic Conductivity",
          type: "textarea",
          helpText: "How well the atmosphere conducts, disperses, or blocks magical energy."
        },
        {
          name: "atmospheric_magic_filtering",
          label: "Atmospheric Magic Filtering",
          type: "textarea",
          helpText: "Whether the atmosphere filters incoming cosmic magical radiation."
        },
        {
          name: "high_altitude_magic_effects",
          label: "High Altitude Magic Effects",
          type: "textarea",
          helpText: "How magic behaves differently at extreme altitudes."
        },
        {
          name: "windborne_magic",
          label: "Windborne Magic",
          type: "textarea",
          helpText: "Magical energy carried by winds\u2014mana breezes, spell-carrying gales, etc."
        },
        {
          name: "magic_relevance",
          label: "Magic Relevance",
          type: "select",
          options: ["none", "minor", "moderate", "major", "fundamental"],
          helpText: "How central magic is to this atmosphere."
        },
        {
          name: "custom_magic_notes",
          label: "Custom Magic Notes",
          type: "textarea",
          placeholder: "Any additional notes about magical aspects...",
          helpText: "Free-form notes on magical properties not covered above."
        }
      ],
      manaSensitivity: "active",
      planeAware: false,
      prompts: [
        "Does mana concentrate at certain altitudes, creating layers where spellcasting is stronger or weaker?",
        "Can winds carry magical energy across continents, spreading enchantments or curses far from their source?",
        "Are there visible magical phenomena in the sky\u2014arcane auroras, mana storms, or luminous spell-trails?"
      ]
    },
    archetypes: [
      {
        id: "earth_like",
        name: "Earth-like Atmosphere",
        description: "A nitrogen-oxygen atmosphere suitable for carbon-based life, with active weather.",
        element_type: "atmospheric_layer",
        summary: "A breathable nitrogen-oxygen atmosphere with familiar weather patterns",
        fields: {
          breathable: true,
          pressure: "1.0 atm at sea level",
          color: "Blue, with white cloud formations",
          wind_systems: "Global circulation with trade winds, westerlies, and polar easterlies. Seasonal monsoons in tropical regions.",
          weather_patterns: "Regular precipitation cycles, thunderstorms in warm seasons, frontal systems in temperate zones. Hurricanes form over warm oceans."
        }
      },
      {
        id: "thick_greenhouse",
        name: "Thick Greenhouse Atmosphere",
        description: "A dense, hot atmosphere with a runaway greenhouse effect \u2014 hostile to most life.",
        element_type: "atmospheric_layer",
        summary: "A crushing, superheated atmosphere with acid clouds",
        fields: {
          breathable: false,
          pressure: "90+ atm at surface",
          color: "Yellowish-orange haze",
          wind_systems: "Superrotation of upper atmosphere. Extreme surface winds are slow due to density but carry tremendous force.",
          weather_patterns: "Sulfuric acid rain that evaporates before reaching the surface. Permanent cloud cover blocks direct sunlight."
        }
      },
      {
        id: "thin_highland",
        name: "Thin Highland Atmosphere",
        description: "A sparse atmosphere with low pressure \u2014 breathable at lower elevations but dangerously thin at altitude.",
        element_type: "atmospheric_layer",
        summary: "A thin atmosphere where the sky shades to black at high elevations",
        fields: {
          breathable: true,
          pressure: "0.4-0.7 atm at lowland level",
          color: "Deep indigo, stars visible during the day at high altitudes",
          wind_systems: "Fierce katabatic winds descend from highlands. Dust storms common in dry seasons due to low atmospheric moisture.",
          weather_patterns: "Rapid temperature swings between day and night. Precipitation is rare and localized. Frost forms year-round at higher elevations."
        }
      },
      {
        id: "spore_sea",
        name: "Spore Sea Atmosphere",
        description: "An atmosphere so thick with fungal spores that it behaves like a living medium \u2014 the air itself is an ecosystem.",
        element_type: "atmospheric_phenomenon",
        summary: "An atmosphere saturated with living spores, blurring the line between air and organism",
        fields: {
          breathable: false,
          pressure: "1.2 atm \u2014 slightly heavier due to suspended biomass",
          color: "Golden-green haze with seasonal shifts to deep amber. Visibility rarely exceeds 200 meters.",
          wind_systems: "Spore currents follow thermal patterns but also respond to biological signals \u2014 colonies can redirect airflow by coordinated spore release, creating local weather.",
          weather_patterns: "Spore storms replace rainstorms. Germination events cause localized temperature spikes as billions of spores activate simultaneously. Clear days are rare and considered ominous."
        }
      },
      {
        id: "layered_breathability",
        name: "Stratified Atmosphere",
        description: "An atmosphere breathable only at certain altitudes, forcing civilizations to stratify by height.",
        element_type: "atmospheric_layer",
        summary: "An atmosphere with breathable and toxic bands, forcing life to cluster at specific altitudes",
        detailed_notes: "This atmosphere is not uniformly hospitable. Dense, toxic gases \u2014 heavier than breathable air \u2014 pool in the lowlands, creating a permanent poison layer below approximately 800 meters elevation. Above 4,000 meters, the air thins to the point of uselessness. Between these extremes lies the habitable band: a ribbon of breathable atmosphere where all surface civilization exists. Lowland regions are visible but unreachable without protective equipment, their ruins and resources tantalizingly close but deadly. Highland peaks pierce above the breathable zone into thin, frigid air. Civilizations build along mountain slopes and plateau edges, and elevation is the primary axis of social organization \u2014 the higher you live, the thinner but purer your air, and the greater your status.",
        fields: {
          composition: '{"nitrogen": 65, "oxygen": 18, "carbon_dioxide": 8, "sulfur_compounds": 5, "argon": 3, "other": 1}',
          pressure: "1.4 atm at sea level (toxic zone), 0.9 atm in habitable band, 0.3 atm at high altitude",
          breathable: false,
          color: "Yellowish-brown below the habitable zone, pale blue in the breathable band, deep violet above",
          layers: '[{"name": "Poison Floor", "altitude": "0-800m", "traits": "Dense toxic gases, unbreathable, visibility 50m"}, {"name": "Habitable Band", "altitude": "800-4000m", "traits": "Breathable nitrogen-oxygen mix, temperate"}, {"name": "Thin Crown", "altitude": "4000m+", "traits": "Insufficient oxygen, extreme cold, stars visible by day"}]'
        }
      },
      {
        id: "singing_winds",
        name: "Singing Winds",
        description: "Winds that produce harmonic tones when passing through certain geological or crystalline formations.",
        element_type: "atmospheric_phenomenon",
        summary: "Winds that generate audible music as they interact with the landscape",
        detailed_notes: 'Across certain regions, the wind does not merely blow \u2014 it sings. The phenomenon occurs where prevailing winds encounter specific geological formations: narrow canyon slots, crystalline rock spires, hollow basalt columns, or forests of resonant stone. The resulting tones range from deep, subsonic rumbles felt in the chest to high, clear notes audible for miles. The "music" follows patterns tied to wind speed, direction, and temperature, creating compositions that shift with the weather and seasons. Some formations produce simple drones; others generate complex harmonics that listeners describe as choral or orchestral. Civilizations in these regions have built their musical traditions around the wind-songs, and some have learned to carve stone to create new instruments for the wind to play. On rare occasions when atmospheric conditions align perfectly, the singing reaches a crescendo audible across entire continents \u2014 an event called the Grand Resonance.',
        fields: {
          phenomena: '["harmonic wind tones", "subsonic geological resonance", "Grand Resonance events", "wind-carved tuning formations"]',
          wind_systems: "Prevailing easterlies drive the primary singing through canyon systems. Seasonal shifts in wind direction activate different formation sets, changing the dominant key. Thermal updrafts create descant harmonics in crystalline spire fields.",
          color: "Standard blue sky, but during Grand Resonance events, standing waves in the atmosphere create visible ripple patterns \u2014 shimmering bands of refracted light that pulse in time with the deepest tones."
        }
      },
      {
        id: "luminous_sky",
        name: "Luminous Night Sky",
        description: "An atmosphere that glows at night from bioluminescent particles, auroral activity, or suspended mana.",
        element_type: "atmospheric_phenomenon",
        summary: "A sky that never truly darkens, glowing with its own soft light after sunset",
        detailed_notes: `On this world, night is never dark. After sunset, the atmosphere itself begins to glow \u2014 a soft, diffuse luminescence that ranges from pale green to deep blue depending on the season and latitude. The light comes from multiple sources: bioluminescent microorganisms that drift in the upper atmosphere, feeding on solar radiation during the day and releasing stored energy as light at night; persistent auroral activity driven by the world's unusually strong magnetic field; and, some scholars argue, trace amounts of ambient mana that fluoresce when no longer drowned out by sunlight. The effect is beautiful but has profound consequences. True darkness is unknown \u2014 there are no pitch-black nights, and the concept of "darkness" is philosophical rather than literal. Astronomy is limited, as only the brightest stars and celestial bodies are visible through the glow. Nocturnal species have adapted to the perpetual twilight, and the circadian rhythms of all life are shifted compared to dark-night worlds.`,
        fields: {
          color: "Pale green to cerulean blue at night, shifting to violet near the poles. Standard blue during the day, with a faint residual glow visible at dawn and dusk.",
          phenomena: '["atmospheric bioluminescence", "persistent aurora", "mana fluorescence", "lunar halos amplified by luminous particles", "dark spots \u2014 rare zones where the glow fails, considered omens"]',
          breathable: true
        }
      },
      {
        id: "memory_fog",
        name: "Memory Fog",
        description: "A fog that causes confusion and lost memories in those who breathe it.",
        element_type: "atmospheric_phenomenon",
        summary: "A sinister fog that erases memories and sows confusion in those who wander into it",
        detailed_notes: "Memory Fog is an atmospheric phenomenon of unknown origin that manifests as a dense, low-lying mist with a faintly iridescent quality. It appears without meteorological warning, often in valleys, marshlands, or near sites of historical trauma. Those who breathe the fog experience progressive memory loss beginning with recent memories and working backward \u2014 first forgetting why they entered the fog, then where they were going, then who they are. Short exposures cause temporary amnesia lasting hours to days. Prolonged exposure results in permanent memory erasure. Victims found wandering in the fog are often in a state of childlike bewilderment, unable to recognize their own companions. The fog seems to have a predatory quality: it thickens around those who panic and thins around those who remain calm, as though feeding on distress. Some scholars theorize it is not a weather phenomenon at all but a colonial organism or a psychic residue of mass-casualty events. Settlements near fog-prone areas maintain bell towers and rope lines to guide the lost home.",
        fields: {
          phenomena: '["progressive memory erasure", "iridescent mist", "psychic disruption", "predatory thickening around panicked victims", "residual amnesia lasting hours to weeks"]',
          breathable: false,
          color: "Pearlescent white with faint rainbow iridescence, thicker and more opaque than natural fog. Glows faintly from within at night."
        }
      },
      {
        id: "crystalline_rain",
        name: "Crystalline Rain",
        description: "Precipitation of tiny crystals instead of water drops.",
        element_type: "atmospheric_phenomenon",
        summary: "A precipitation event where the sky rains tiny, tinkling crystals instead of water",
        detailed_notes: "Crystalline Rain occurs in regions where atmospheric mineral content is unusually high \u2014 often near volcanic fields, mana-saturated zones, or areas where industrial alchemical processes have altered the air. Instead of water droplets condensing in clouds, dissolved minerals nucleate around atmospheric dust, forming tiny crystals that grow as they fall. The result is a rain of glittering, tinkling fragments that accumulate on the ground like snow but do not melt. The crystals vary in composition depending on local atmospheric chemistry: silicate crystals in volcanic regions produce a harsh, sharp rain that can lacerate exposed skin, while mana-crystallized precipitation in magical zones produces soft, luminous fragments that dissolve slowly and release stored energy. The sound of crystalline rain is distinctive \u2014 a continuous, musical tinkling quite unlike the white noise of water rain. Heavy crystal storms can accumulate to dangerous depths, burying roads and collapsing roofs under the weight of mineral deposits.",
        fields: {
          phenomena: '["mineral crystal precipitation", "tinkling rainfall", "accumulation deposits", "variable crystal composition", "laceration hazard in silicate storms"]',
          color: "Sky turns a pale metallic silver during crystal rain events. The falling crystals catch light, creating a shimmering curtain effect visible for miles.",
          weather_patterns: "Crystal rain events follow volcanic eruptions or mana surges by 2-5 days, as mineral-laden air masses cool and precipitate. Seasonal patterns emerge in volcanically active regions, with crystal rain most common in cool months when atmospheric temperatures drop below mineral condensation thresholds."
        }
      },
      {
        id: "void_layer",
        name: "Void Ceiling",
        description: "An altitude where the atmosphere simply stops \u2014 a hard ceiling on the world.",
        element_type: "atmospheric_layer",
        summary: "An absolute atmospheric boundary \u2014 a hard ceiling beyond which there is nothing",
        detailed_notes: 'The Void Ceiling is an atmospheric anomaly with no natural analogue: at a specific altitude, the atmosphere does not thin gradually into space but terminates abruptly. One moment there is breathable air at reasonable pressure; the next, there is absolute void \u2014 no air, no pressure, no sound, no heat transfer. The boundary is sharp enough to touch: climbers who reach it describe pressing their hands against an invisible wall of nothing. Objects pushed through the boundary freeze instantly and hang motionless in the void, neither falling nor floating. The Void Ceiling imposes an absolute limit on the world \u2014 there is no "space" above it, no stars visible through it (the sky simply goes black), and no way to reach other celestial bodies that may or may not exist above the boundary. The philosophical and theological implications are profound: is the world a sealed container? What lies above the void? Some civilizations accept the ceiling as the edge of reality; others mount desperate expeditions to breach it.',
        fields: {
          layers: '[{"name": "Breathable Zone", "altitude": "0-12km", "traits": "Normal breathable atmosphere with standard weather"}, {"name": "Thinning Band", "altitude": "12-14.8km", "traits": "Rapidly decreasing pressure and temperature"}, {"name": "Void Boundary", "altitude": "14.8km", "traits": "Absolute termination of atmosphere \u2014 hard vacuum beyond"}]',
          pressure: "1.0 atm at sea level, decreasing normally until 14.8 km, then instantaneous drop to 0.0 atm",
          breathable: true,
          color: "Standard blue at low altitudes, darkening to black above 10 km. No gradual transition to space \u2014 the sky simply ends in featureless black at the Void Ceiling."
        }
      }
    ],
    defaultSortField: "pressure"
  };

  // src/domains/climate.ts
  var climateConfig = {
    id: "climate",
    name: "Climate",
    namePlural: "Climate Zones",
    icon: "thermometer",
    color: "#ff9f43",
    description: "Establish the long-term weather patterns, seasonal cycles, and climate zones that govern temperature, precipitation, and habitability across your world.",
    tableName: "climate_zones",
    category: "natural",
    fields: [
      {
        name: "zone_type",
        label: "Zone Type",
        type: "select",
        required: true,
        options: ["tropical", "arid", "temperate", "continental", "polar", "custom"],
        helpText: "The broad climate classification for this zone."
      },
      {
        name: "avg_temp_high",
        label: "Average High Temperature",
        type: "number",
        placeholder: "\xB0C",
        helpText: "Typical high temperature during the warmest period."
      },
      {
        name: "avg_temp_low",
        label: "Average Low Temperature",
        type: "number",
        placeholder: "\xB0C",
        helpText: "Typical low temperature during the coldest period."
      },
      {
        name: "annual_precipitation",
        label: "Annual Precipitation",
        type: "text",
        placeholder: "e.g. 800 mm/year",
        helpText: "Total yearly precipitation (rain, snow, etc.)."
      },
      {
        name: "dominant_wind",
        label: "Dominant Wind",
        type: "text",
        placeholder: "e.g. Westerlies, Trade winds",
        helpText: "The prevailing wind pattern in this climate zone."
      },
      {
        name: "season_count",
        label: "Number of Seasons",
        type: "number",
        min: 1,
        max: 20,
        step: 1,
        helpText: "How many distinct seasons this zone experiences."
      },
      {
        name: "humidity",
        label: "Humidity",
        type: "text",
        placeholder: "e.g. arid, semi-arid, moderate, humid, saturated",
        helpText: "Typical humidity level for this climate zone."
      },
      {
        name: "weather_extremes",
        label: "Weather Extremes",
        type: "json",
        placeholder: '["hurricanes", "blizzards", "flash floods", "dust storms"]',
        helpText: "Extreme weather events that can occur in this climate zone."
      },
      {
        name: "historical_shifts",
        label: "Historical Climate Shifts",
        type: "textarea",
        placeholder: "Describe long-term climate changes \u2014 ice ages, warming periods, desertification...",
        helpText: "How this climate zone has changed over geological or historical time."
      },
      {
        name: "season_descriptions",
        label: "Season Descriptions",
        type: "json",
        placeholder: '[{"name": "Verdance", "months": "1-4", "desc": "warm rains"}]',
        helpText: "Details for each season: name, timing, and characteristics."
      }
    ],
    elementTypes: ["climate_zone", "season", "weather_pattern", "climate_event"],
    elementTypeDescriptions: {
      climate_zone: "A region with consistent long-term weather characteristics \u2014 temperature range, precipitation, and humidity that define what can live there.",
      season: "A recurring period within a year defined by predictable weather changes. Driven by axial tilt, orbital position, or magical cycles.",
      weather_pattern: "A recurring atmospheric condition tied to geography or season \u2014 monsoons, dry spells, fog banks, or perpetual drizzle.",
      climate_event: "A significant, often disruptive climatic occurrence \u2014 ice ages, droughts, super-storms, or sudden shifts in global temperature."
    },
    prompts: [
      "Does your world have familiar seasons, or something entirely different\u2014perhaps a long winter, dual summers, or a mana-tide season?",
      "How do axial tilt, orbital mechanics, and atmospheric composition combine to create your climate zones?",
      "Are there regions with extreme or paradoxical climates\u2014a frozen desert, a tropical pole, or a storm that never ends?",
      "How has climate changed over historical time? Were there ice ages, warming periods, or sudden shifts?",
      "What role does precipitation play in agriculture, settlement patterns, and conflict?"
    ],
    magicPermeation: {
      companionTable: "climate_magic_aspects",
      fields: [
        {
          name: "magic_influenced_seasons",
          label: "Magic-Influenced Seasons",
          type: "textarea",
          helpText: "Seasons that exist because of or are modified by magical forces."
        },
        {
          name: "mana_tides",
          label: "Mana Tides",
          type: "textarea",
          helpText: "Cyclical fluctuations in ambient mana that follow seasonal or longer patterns."
        },
        {
          name: "climate_zones_magical_character",
          label: "Magical Character of Climate Zones",
          type: "textarea",
          helpText: "How the magical nature of each climate zone differs\u2014mana-rich tropics vs. mana-sparse tundra, etc."
        },
        {
          name: "weather_magic_interaction",
          label: "Weather-Magic Interaction",
          type: "textarea",
          helpText: "How weather events interact with magic\u2014do storms amplify spells? Does drought starve enchantments?"
        },
        {
          name: "seasonal_magic_rituals",
          label: "Seasonal Magic Rituals",
          type: "textarea",
          helpText: "Rituals or traditions tied to seasonal shifts in magical energy."
        },
        {
          name: "long_term_magical_climate_change",
          label: "Long-Term Magical Climate Change",
          type: "textarea",
          helpText: "How magical events or practices have altered climate over centuries."
        },
        {
          name: "magical_precipitation",
          label: "Magical Precipitation",
          type: "textarea",
          helpText: "Rain, snow, or other precipitation infused with magical properties."
        },
        {
          name: "magic_relevance",
          label: "Magic Relevance",
          type: "select",
          options: ["none", "minor", "moderate", "major", "fundamental"],
          helpText: "How central magic is to this climate zone."
        },
        {
          name: "custom_magic_notes",
          label: "Custom Magic Notes",
          type: "textarea",
          placeholder: "Any additional notes about magical aspects...",
          helpText: "Free-form notes on magical properties not covered above."
        }
      ],
      manaSensitivity: "active",
      planeAware: false,
      prompts: [
        'Do mana levels rise and fall with the seasons? Is there a "mana spring" when magical energy surges, or a "dead winter" when it fades?',
        "Has large-scale spellcasting or magical industry altered the climate irreversibly\u2014magical global warming or ice-age induction?",
        "Does magical precipitation\u2014mana rain, enchanted snow\u2014have lasting effects on the land and creatures it touches?"
      ]
    },
    archetypes: [
      {
        id: "temperate_maritime",
        name: "Temperate Maritime",
        description: "A mild, rainy climate moderated by nearby ocean currents \u2014 think western coastlines.",
        element_type: "climate_zone",
        summary: "A mild oceanic climate with cool winters and warm summers",
        fields: {
          zone_type: "temperate",
          avg_temp_high: 22,
          avg_temp_low: 2,
          annual_precipitation: "800-1200 mm annually",
          dominant_wind: "Prevailing westerlies from the ocean",
          season_count: 4,
          humidity: "Moderate to high year-round (65-85%)"
        }
      },
      {
        id: "tropical_monsoon",
        name: "Tropical Monsoon",
        description: "A hot climate with dramatic wet and dry seasons driven by shifting wind patterns.",
        element_type: "climate_zone",
        summary: "A hot tropical climate with intense monsoon rains",
        fields: {
          zone_type: "tropical",
          avg_temp_high: 35,
          avg_temp_low: 22,
          annual_precipitation: "1500-3000 mm, concentrated in the wet season",
          dominant_wind: "Seasonal reversal \u2014 onshore in wet season, offshore in dry",
          season_count: 2,
          humidity: "Very high in wet season (85-100%), moderate in dry (40-60%)"
        }
      },
      {
        id: "polar_tundra",
        name: "Polar Tundra",
        description: "A frigid climate with permafrost, brief summers, and months of continuous darkness or light.",
        element_type: "climate_zone",
        summary: "A frozen tundra with extreme seasonal light variation",
        fields: {
          zone_type: "polar",
          avg_temp_high: 8,
          avg_temp_low: -40,
          annual_precipitation: "150-300 mm (mostly snow)",
          dominant_wind: "Polar easterlies with frequent blizzards",
          season_count: 2,
          humidity: "Low (20-40%), but feels damp due to permafrost moisture"
        }
      },
      {
        id: "arid_desert",
        name: "Arid Desert",
        description: "An extremely dry climate with scorching days, cold nights, and almost no rainfall.",
        element_type: "climate_zone",
        summary: "A harsh desert climate with extreme temperature swings",
        fields: {
          zone_type: "arid",
          avg_temp_high: 45,
          avg_temp_low: -5,
          annual_precipitation: "Under 100 mm annually",
          dominant_wind: "Hot, dry winds carrying fine sand and dust",
          season_count: 2,
          humidity: "Extremely low (5-20%)"
        }
      },
      {
        id: "magical_inversion",
        name: "Magical Inversion Zone",
        description: "A climate zone where magical saturation overrides normal weather \u2014 mana storms, crystal snow, and seasons that change based on celestial alignment rather than axial tilt.",
        element_type: "climate_event",
        summary: "A region where magic has hijacked the weather cycle entirely",
        fields: {
          zone_type: "custom",
          avg_temp_high: 35,
          avg_temp_low: -20,
          annual_precipitation: "Variable \u2014 includes mana rain, crystal sleet, and liquid starlight depending on planar conditions",
          dominant_wind: "Mana currents that shift with ley line activity, not pressure systems",
          season_count: 7,
          humidity: "Fluctuates wildly \u2014 can shift from bone-dry to saturated in hours during mana surges"
        }
      },
      {
        id: "eternal_twilight",
        name: "Eternal Twilight Zone",
        description: "A climate region in permanent dim light \u2014 between a tidally locked day and night side.",
        element_type: "climate_zone",
        summary: "A narrow band of perpetual dusk between a scorched dayside and a frozen nightside",
        detailed_notes: "On a tidally locked world, one hemisphere faces the star in permanent day while the other faces away in permanent night. Between them lies the twilight zone \u2014 a narrow ring of perpetual dim light where the sun sits forever on the horizon. This band is the only habitable region, and all civilization clusters here. Temperatures are moderate but vary sharply over short distances: a few miles toward the dayside brings searing heat, while a few miles toward the nightside brings lethal cold. Winds are constant and fierce, driven by the extreme temperature differential between the hemispheres. The eternal sunset casts everything in amber and rose, and shadows are always long. Crops grow in the dim light but slowly, and the psychological effects of never seeing full daylight or true darkness shape the culture profoundly.",
        fields: {
          zone_type: "custom",
          avg_temp_high: 28,
          avg_temp_low: -5,
          annual_precipitation: "600-900 mm, primarily from moisture carried by winds from the dayside",
          dominant_wind: "Constant gales blowing from the hot dayside toward the cold nightside, moderated by Coriolis effect",
          season_count: 1,
          humidity: "Moderate (50-70%), with fog banks common where warm and cold air masses meet",
          weather_extremes: '["thermal gradient storms", "dayside heat surges", "nightside cold snaps", "perpetual fog banks"]'
        }
      },
      {
        id: "storm_belt",
        name: "Permanent Storm Belt",
        description: "A band of continuous storms that divides the world into hemispheres, passable only by the desperate or the mad.",
        element_type: "climate_event",
        summary: "An unbroken wall of storms encircling the planet, dividing the world in two",
        detailed_notes: "The storm belt is a continuous band of violent weather that wraps around the planet like a ribbon, roughly following the equator but shifting north and south with a slow, unpredictable oscillation. Within the belt, conditions are apocalyptic: winds exceed 300 km/h, lightning strikes are nearly continuous, rain falls in horizontal sheets, and visibility drops to zero. The belt is approximately 200 km wide at its narrowest and 500 km at its widest. No permanent settlement exists within it, and crossing it is one of the most dangerous undertakings in the world. The few successful crossings are legendary \u2014 most who attempt it are never seen again. The storm belt effectively divides the world into two hemispheres with separate civilizations, languages, and histories. Trade and communication between the hemispheres is rare, expensive, and heroic. Scholars debate whether the belt is a natural meteorological phenomenon, a remnant of an ancient magical war, or a deliberate barrier placed by the gods.",
        fields: {
          zone_type: "custom",
          avg_temp_high: 18,
          avg_temp_low: 5,
          annual_precipitation: "Unmeasurable \u2014 continuous precipitation exceeding 15,000 mm equivalent",
          dominant_wind: "Chaotic and violent, averaging 200+ km/h with gusts exceeding 400 km/h",
          season_count: 1,
          humidity: "Saturated (100%) at all times",
          weather_extremes: '["continuous lightning", "horizontal rain", "waterspouts", "hail bombardment", "wind shear fatal to aircraft"]'
        }
      },
      {
        id: "mana_seasons",
        name: "Mana Tide Seasons",
        description: "Seasons driven by magical tides rather than axial tilt \u2014 when mana surges, everything blooms and burns.",
        element_type: "season",
        summary: "A seasonal cycle driven by the ebb and flow of magical energy rather than solar geometry",
        detailed_notes: "In this world, seasons are not caused by the tilt of the planet's axis but by cyclical fluctuations in ambient magical energy \u2014 the mana tides. When mana surges (the Bloom), temperatures rise, plants grow explosively, animals become hyperactive, and the air itself crackles with potential. When mana ebbs (the Fade), temperatures drop, growth slows to nothing, and a profound stillness settles over the land. The transition periods \u2014 the Kindling and the Dimming \u2014 bring their own weather: mana storms during the Kindling as energy floods back into the system, and mana fog during the Dimming as residual energy condenses and dissipates. The mana tide cycle does not follow solar geometry, so it can be summer by temperature during a Bloom while the sun is in its winter position. This creates deeply counterintuitive weather \u2014 warm winters, cold summers \u2014 that confounds visitors from non-magical worlds.",
        fields: {
          zone_type: "custom",
          avg_temp_high: 38,
          avg_temp_low: -15,
          annual_precipitation: "1000-2000 mm, concentrated during the Kindling as mana-charged rain",
          dominant_wind: "Shifts with mana tide phase \u2014 inward toward high-mana zones during Bloom, outward during Fade",
          season_count: 4,
          humidity: "High during Bloom (80-100%), very low during Fade (10-25%)",
          season_descriptions: '[{"name": "The Bloom", "months": "1-3", "desc": "Mana surges. Explosive growth, rising temperatures, hyperactive fauna. Magic is easy and wild."}, {"name": "The Kindling", "months": "4-6", "desc": "Mana floods back. Violent mana storms, unpredictable weather, charged precipitation."}, {"name": "The Fade", "months": "7-9", "desc": "Mana ebbs. Cold, stillness, dormancy. Magic is difficult and costly."}, {"name": "The Dimming", "months": "10-12", "desc": "Residual mana condenses. Mana fog, gentle cooling, reflective calm."}]'
        }
      },
      {
        id: "color_seasons",
        name: "Color Seasons",
        description: "Seasons defined by the color the sky and foliage turns rather than temperature changes.",
        element_type: "season",
        summary: "A seasonal cycle defined by dramatic shifts in the color of sky and vegetation rather than temperature",
        detailed_notes: "In this climate, the traditional markers of seasonal change \u2014 temperature, precipitation, day length \u2014 remain relatively constant year-round. Instead, the seasons are defined by sweeping changes in color that affect the sky, foliage, water, and even the soil. During the Azure Season, the sky deepens to an intense cobalt and plants shift to blue-green hues. The Crimson Season brings a blood-red sky and scarlet-leafed forests. The Gold Season bathes everything in amber, and the Pale Season bleaches the world to ghostly whites and silvers. The color shifts are caused by seasonal changes in atmospheric particle composition \u2014 different mineral dusts, biological spores, and chemical compounds dominate the air at different times, filtering sunlight into distinct spectra. The effect is not merely visual: each color season brings different photosynthetic conditions, favoring different plant species and triggering distinct animal behaviors. Civilizations mark time by color, not temperature, and their art, clothing, and festivals reflect the dominant hue.",
        fields: {
          zone_type: "custom",
          season_count: 4,
          avg_temp_high: 25,
          avg_temp_low: 18
        }
      },
      {
        id: "whisper_winter",
        name: "Whisper Winter",
        description: "A season of unnatural silence where even sound is dampened.",
        element_type: "season",
        summary: "A chilling season where sound itself is suppressed, wrapping the world in eerie silence",
        detailed_notes: `Whisper Winter is not merely cold \u2014 it is quiet. As the season descends, an atmospheric phenomenon causes progressive sound dampening across the affected region. Snow falls in absolute silence. Shouts carry only a few meters. Footsteps in snow make no crunch. Conversations become whispered by necessity, as raising one's voice produces only a muffled murmur. The mechanism is debated: some scholars attribute it to a temperature-dependent change in atmospheric density that absorbs acoustic energy, while others point to the crystalline structure of the winter precipitation, which forms sound-absorbing lattices on every surface. The psychological effects are profound. The unnatural silence induces paranoia, depression, and a condition called "whisper-madness" in those who cannot adapt. Predators thrive, as prey cannot hear them approach. Communication over distance becomes impossible without visual signals. Communities develop elaborate sign languages and light-based communication systems that are used only during Whisper Winter and forgotten by spring.`,
        fields: {
          zone_type: "polar",
          avg_temp_high: -5,
          avg_temp_low: -35,
          humidity: "Very low (10-20%) \u2014 the cold air holds almost no moisture, contributing to the sound-dampening effect"
        }
      },
      {
        id: "hunger_season",
        name: "Hunger Season",
        description: "A brutal annual period where magic or natural resources become scarce.",
        element_type: "climate_event",
        summary: "A dreaded annual period of absolute scarcity when both natural and magical resources fail",
        detailed_notes: "The Hunger Season is the most feared time of year \u2014 a period of weeks to months when the world's generosity simply stops. Crops wither regardless of water and soil quality. Game animals vanish into hiding places that defy tracking. Fish abandon coastal waters for the unreachable deep. Fruit rots on the branch before ripening. In magical regions, the deprivation extends to mana itself: spells fail, enchanted items go dormant, and healers find their powers useless precisely when they are most needed. The cause is cyclical but not fully understood \u2014 some scholars link it to a celestial alignment that disrupts the flow of life energy, while others attribute it to the world's ecosystem entering a periodic dormancy analogous to a heartbeat's pause between beats. Civilizations survive the Hunger Season through stockpiling, rationing, and communal solidarity \u2014 but every year, the vulnerable perish. The end of the Hunger Season is celebrated with the most important festival in the calendar, a release of pent-up desperation into wild relief.",
        fields: {
          zone_type: "custom",
          avg_temp_high: 15,
          season_count: 2
        }
      }
    ],
    defaultSortField: "zone_type"
  };

  // src/domains/biomes.ts
  var biomesConfig = {
    id: "biomes",
    name: "Biome",
    namePlural: "Biomes",
    icon: "trees",
    color: "#2ecc71",
    description: "Define the major ecological regions of your world\u2014forests, deserts, tundra, and realms that have no earthly equivalent. Biomes tie together climate, terrain, and the living things that inhabit them.",
    tableName: "biomes",
    category: "natural",
    fields: [
      {
        name: "biome_type",
        label: "Biome Type",
        type: "select",
        required: true,
        options: ["forest", "desert", "tundra", "grassland", "wetland", "ocean", "cave", "sky", "volcanic", "custom"],
        helpText: "The broad ecological classification of this biome."
      },
      {
        name: "temperature_range",
        label: "Temperature Range",
        type: "text",
        placeholder: "e.g. -10\xB0C to 25\xB0C",
        helpText: "Typical temperature range experienced in this biome."
      },
      {
        name: "moisture_level",
        label: "Moisture Level",
        type: "text",
        placeholder: "e.g. arid, moderate, saturated",
        helpText: "General moisture availability in this biome."
      },
      {
        name: "elevation_range",
        label: "Elevation Range",
        type: "text",
        placeholder: "e.g. 0-500m, 2000-4000m",
        helpText: "Typical elevation range where this biome occurs."
      },
      {
        name: "dominant_terrain",
        label: "Dominant Terrain",
        type: "text",
        placeholder: "e.g. rolling hills, flat plains, rocky crags",
        helpText: "The primary terrain type that characterizes this biome."
      },
      {
        name: "climate_zone_id",
        label: "Climate Zone",
        type: "text",
        placeholder: "ID of the associated climate zone",
        helpText: "The climate zone that governs this biome's weather patterns."
      },
      {
        name: "carrying_capacity",
        label: "Carrying Capacity",
        type: "text",
        placeholder: "e.g. high, moderate, low, overstressed",
        helpText: "The maximum population and activity level this biome can sustainably support."
      }
    ],
    elementTypes: ["forest", "desert", "tundra", "grassland", "wetland", "ocean_zone", "cave_system", "sky_realm", "volcanic", "custom"],
    elementTypeDescriptions: {
      forest: "A biome dominated by trees, with a layered canopy structure. Ranges from temperate deciduous to tropical rainforest.",
      desert: "A biome defined by extreme aridity \u2014 hot or cold, sandy or rocky. Life here is specialized for water conservation.",
      tundra: "A cold, treeless biome with permafrost, short growing seasons, and hardy low vegetation. Found at high latitudes or altitudes.",
      grassland: "An open biome of grasses and wildflowers with few trees. Supports large herds and is often converted to farmland.",
      wetland: "A biome where the land is saturated or submerged for part or all of the year. Incredibly biodiverse and ecologically vital.",
      ocean_zone: "A marine biome defined by depth, light, and temperature \u2014 from sunlit shallows to the lightless abyss.",
      cave_system: "An underground biome sustained by chemosynthesis, drip-water nutrients, or magical energy rather than sunlight.",
      sky_realm: "A biome that exists in the upper atmosphere \u2014 floating islands, cloud forests, or aerial ecosystems with no ground.",
      volcanic: "A biome shaped by active volcanism \u2014 lava fields, geothermal vents, ash plains, and extremophile communities.",
      custom: "A biome that doesn't fit standard categories \u2014 something unique to your world."
    },
    prompts: [
      "What biomes exist in your world that have no real-world equivalent? A crystal forest, a living desert, floating sky-islands?",
      "How do biome boundaries work\u2014are transitions gradual or sharp? Are there contested borderlands between ecosystems?",
      "What is the most dangerous biome in your world, and what makes it lethal to the unprepared?",
      "How have sentient species altered biomes through agriculture, urbanization, or magical terraforming?",
      "Are there biomes that are expanding or shrinking? What forces drive those changes?"
    ],
    magicPermeation: {
      companionTable: "biomes_magic_aspects",
      fields: [
        {
          name: "mana_saturation_level",
          label: "Mana Saturation Level",
          type: "textarea",
          helpText: "How much ambient magical energy permeates this biome."
        },
        {
          name: "wild_magic_presence",
          label: "Wild Magic Present",
          type: "boolean",
          helpText: "Whether uncontrolled wild magic manifests in this biome."
        },
        {
          name: "wild_magic_description",
          label: "Wild Magic Description",
          type: "textarea",
          helpText: "How wild magic manifests\u2014random effects, chaotic surges, reality warping."
        },
        {
          name: "enchanted_biome_features",
          label: "Enchanted Biome Features",
          type: "textarea",
          helpText: "Magical features unique to this biome\u2014glowing flora, floating stones, singing rivers."
        },
        {
          name: "dominant_magic_type",
          label: "Dominant Magic Type",
          type: "text",
          helpText: "The school, element, or type of magic most naturally occurring here."
        },
        {
          name: "magical_hazards",
          label: "Magical Hazards",
          type: "textarea",
          helpText: "Dangers arising from the magical nature of the biome."
        },
        {
          name: "magic_effect_on_biodiversity",
          label: "Magic Effect on Biodiversity",
          type: "textarea",
          helpText: "How ambient magic increases, decreases, or warps species diversity."
        },
        {
          name: "biome_magic_source_id",
          label: "Biome Magic Source",
          type: "text",
          helpText: "The primary source of magical energy sustaining this biome."
        },
        {
          name: "transition_zone_magic",
          label: "Transition Zone Magic",
          type: "textarea",
          helpText: "Magical phenomena occurring at the boundaries between biomes."
        },
        {
          name: "magic_relevance",
          label: "Magic Relevance",
          type: "select",
          options: ["none", "minor", "moderate", "major", "fundamental"],
          helpText: "How central magic is to this biome's existence and ecology."
        },
        {
          name: "custom_magic_notes",
          label: "Custom Magic Notes",
          type: "textarea",
          placeholder: "Any additional notes about magical aspects...",
          helpText: "Free-form notes on magical properties not covered above."
        }
      ],
      manaSensitivity: "active",
      planeAware: true,
      prompts: [
        "Are there biomes that exist only because of magic\u2014regions where ambient mana sustains impossible ecosystems?",
        "How does wild magic affect a biome? Do random surges mutate creatures, shift terrain, or create pockets of altered reality?",
        "At the edges where high-magic and low-magic biomes meet, what unusual phenomena occur in the transition zones?"
      ]
    },
    archetypes: [
      {
        id: "temperate_forest",
        name: "Temperate Forest",
        description: "A deciduous or mixed forest with four seasons, rich soil, and layered canopy structure.",
        element_type: "forest",
        summary: "A four-season forest with dense canopy and rich undergrowth",
        fields: {
          biome_type: "forest",
          temperature_range: "-5\xB0C to 30\xB0C across seasons",
          moisture_level: "Moderate to high, 750-1500mm annual precipitation",
          elevation_range: "0-2000m",
          dominant_terrain: "Rolling hills with deep loam soils, crisscrossed by streams",
          carrying_capacity: "High \u2014 dense canopy supports complex food webs"
        }
      },
      {
        id: "tropical_rainforest",
        name: "Tropical Rainforest",
        description: "A hot, humid biome with extraordinary biodiversity and a multi-layered canopy.",
        element_type: "forest",
        summary: "A lush equatorial rainforest teeming with life",
        fields: {
          biome_type: "forest",
          temperature_range: "24\xB0C to 32\xB0C year-round",
          moisture_level: "Very high, 2000-4000mm annual precipitation",
          elevation_range: "0-1000m",
          dominant_terrain: "Flat to gently undulating terrain with thin, nutrient-poor soil beneath thick leaf litter",
          carrying_capacity: "Extremely high \u2014 the most species-dense biome"
        }
      },
      {
        id: "arid_desert_biome",
        name: "Arid Desert",
        description: "A harsh, sun-baked biome where life clings to scarce water sources.",
        element_type: "desert",
        summary: "A vast desert where survival demands adaptation",
        fields: {
          biome_type: "desert",
          temperature_range: "-5\xB0C at night to 50\xB0C by day",
          moisture_level: "Extremely low, under 250mm annual precipitation",
          elevation_range: "0-1500m",
          dominant_terrain: "Sandy dunes, gravel plains, and rocky outcrops with dry washes",
          carrying_capacity: "Very low \u2014 life concentrated around oases and seasonal water"
        }
      },
      {
        id: "coral_reef_biome",
        name: "Coral Reef",
        description: "A shallow marine biome built by coral organisms, forming an underwater oasis of biodiversity.",
        element_type: "ocean_zone",
        summary: "A vibrant coral reef ecosystem in warm, shallow seas",
        fields: {
          biome_type: "ocean",
          temperature_range: "20\xB0C to 29\xB0C",
          moisture_level: "N/A (fully submerged)",
          elevation_range: "0 to -60m depth",
          dominant_terrain: "Calcium carbonate reef structures built by coral polyps, with sandy channels and reef walls",
          carrying_capacity: "Very high \u2014 rivals rainforests in species density"
        }
      },
      {
        id: "deep_cavern",
        name: "Deep Cavern Biome",
        description: "A lightless underground biome sustained by chemosynthesis and geological energy.",
        element_type: "cave_system",
        summary: "A sunless underground world with alien-like adapted life",
        fields: {
          biome_type: "cave",
          temperature_range: "10\xB0C to 18\xB0C (stable year-round)",
          moisture_level: "High humidity (90-100%) with dripping water and underground pools",
          elevation_range: "-50m to -2000m below surface",
          dominant_terrain: "Limestone chambers, lava tubes, and subterranean rivers in perpetual darkness",
          carrying_capacity: "Low \u2014 food webs based on chemosynthesis and detritus from the surface"
        }
      },
      {
        id: "crystalline_waste",
        name: "Crystalline Waste",
        description: "A biome of living crystals that grow, compete for light, and shatter to reproduce \u2014 geology behaving like biology.",
        element_type: "custom",
        summary: "A landscape where mineral formations grow, compete, and evolve like living things",
        fields: {
          biome_type: "custom",
          temperature_range: "40\xB0C at the crystal surface (absorbed solar heat), -10\xB0C in the shade between formations",
          moisture_level: "Near zero \u2014 crystals absorb all available moisture",
          elevation_range: "500-2000m (crystal spires reach 30m+)",
          dominant_terrain: "Fields of translucent crystalline spires, some razor-sharp, others smooth and singing in the wind. The ground is a crust of shattered crystal fragments that crunch underfoot.",
          carrying_capacity: "Extremely low for organic life \u2014 a few silicate-eating extremophiles. The crystals themselves may count as a biomass."
        }
      },
      {
        id: "inverted_canopy",
        name: "Inverted Canopy",
        description: "A forest that grows downward from the ceiling of a vast underground cavern, roots in stone and canopy hanging into the abyss.",
        element_type: "cave_system",
        summary: "A subterranean forest dangling from a cavern roof, lit by bioluminescence",
        fields: {
          biome_type: "cave",
          temperature_range: "14\xB0C to 20\xB0C (geothermally stable)",
          moisture_level: "Very high \u2014 condensation drips constantly from the canopy above into the chasm below",
          elevation_range: "Cavern ceiling at -200m, canopy tips at -350m, chasm floor at -600m",
          dominant_terrain: "Massive tree-like organisms grow downward from the cavern roof, their bioluminescent leaves forming a ghostly inverted canopy. Bridges of root and vine connect the hanging groves.",
          carrying_capacity: "Moderate \u2014 rich invertebrate and amphibian fauna adapted to vertical life. Many species are found nowhere else."
        }
      },
      {
        id: "fungal_jungle",
        name: "Fungal Jungle",
        description: "A biome dominated by giant fungi instead of trees \u2014 towering mushrooms, bioluminescent caps, and spore-thick air.",
        element_type: "forest",
        summary: "A dense jungle of colossal fungi where spore clouds replace canopy shade",
        detailed_notes: 'The fungal jungle is a forest without a single tree. Instead, towering mushroom stalks rise 30 to 60 meters, their broad caps interlocking to form a canopy that blocks most light. Beneath the caps, bioluminescent gills cast the understory in shifting blues and greens. The air is thick with spores \u2014 visible as a permanent haze that gives the jungle a dreamlike quality. The ground is a spongy mat of mycelium that connects every organism in a vast underground network, allowing the jungle to function as a single superorganism. Nutrients, chemical signals, and even rudimentary information pass through the mycelial web. Fauna has adapted to the fungal diet: insects with chitin-dissolving enzymes, mammals that graze on mushroom caps, and predators that use the spore haze for ambush cover. The air is technically breathable but irritates lungs over prolonged exposure, and many visitors develop "spore cough" \u2014 a persistent condition that clears only after leaving the biome.',
        fields: {
          biome_type: "forest",
          temperature_range: "18\xB0C to 28\xB0C \u2014 stable due to the insulating spore canopy",
          moisture_level: "Very high \u2014 90-100% humidity, with condensation dripping constantly from cap undersides",
          elevation_range: "0-800m",
          dominant_terrain: "Spongy mycelial floor punctuated by massive mushroom trunks. Bracket fungi form natural shelves and platforms at various heights. Pools of collected condensation dot the floor.",
          carrying_capacity: "High \u2014 the mycelial network recycles nutrients with extreme efficiency, supporting dense populations of adapted fauna"
        }
      },
      {
        id: "salt_flat_biome",
        name: "Salt Flat",
        description: "A vast, blinding expanse of crystallized salt \u2014 beautiful, hostile, and hiding life in the crust below.",
        element_type: "desert",
        summary: "An endless plain of crystallized salt, blindingly white and deceptively alive beneath the crust",
        detailed_notes: 'The salt flat stretches to the horizon in every direction \u2014 a perfectly level plane of white crystal that reflects the sky so completely it appears to merge with it. The effect is disorienting: without landmarks, travelers lose all sense of distance and direction. Mirages are constant and vivid. The surface is a hard crust of halite and gypsum crystals, some forming geometric patterns of stunning beauty. Beneath this crust, however, lies a thin but persistent brine layer \u2014 and within it, extremophile organisms thrive. Brine shrimp, salt-tolerant algae, and halophilic bacteria form a hidden ecosystem invisible from the surface. During rare rain events, the flat transforms into a shallow mirror lake centimeters deep, creating the famous "sky mirror" effect where the ground perfectly reflects clouds and stars. These brief wet periods trigger explosive reproduction in the subsurface organisms, staining patches of the flat pink, orange, and red before the water evaporates and the white silence returns.',
        fields: {
          biome_type: "desert",
          temperature_range: "-8\xB0C at night to 52\xB0C by day \u2014 the white surface reflects heat upward but the ground stores it",
          moisture_level: "Extremely low on the surface, moderate in subsurface brine layer",
          elevation_range: "1200-1300m (remarkably flat, less than 1m variation over hundreds of km)",
          dominant_terrain: "Perfectly flat crystalline salt crust with polygonal fracture patterns. Occasional salt pillars where mineral-laden water has evaporated over centuries.",
          carrying_capacity: "Near zero on the surface \u2014 moderate in the subsurface brine ecosystem. Migratory birds use the flat as a waypoint during rare wet periods."
        }
      },
      {
        id: "floating_reef",
        name: "Floating Sky Reef",
        description: "A biome of organisms growing on airborne debris and floating rock \u2014 a reef in the clouds.",
        element_type: "sky_realm",
        summary: "A living reef suspended in the atmosphere, built by organisms that never touch the ground",
        detailed_notes: "High in the atmosphere, where updrafts from volcanic fields meet moisture-laden trade winds, a reef grows in the sky. It began with floating mineral fragments \u2014 pumice, levitite-laced rock, volcanic glass \u2014 caught in a stable atmospheric vortex. Over millennia, airborne organisms colonized these fragments: lichens first, then mosses, then increasingly complex life forms that evolved to never need solid ground. Today the sky reef is a sprawling three-dimensional ecosystem of interconnected floating masses, some as small as a fist and others the size of city blocks. Vine-like organisms bridge the gaps between fragments, and the reef's own accumulated biomass generates updrafts that help sustain its altitude. Birds nest in its crevices, insects swarm around its flowering surfaces, and at least one species of small mammal has been observed living its entire life cycle within the reef, leaping between fragments with adapted gliding membranes. The reef migrates slowly with the seasons, following wind patterns, and the shadow it casts on the ground below moves like a vast, living cloud.",
        fields: {
          biome_type: "sky",
          temperature_range: "-5\xB0C to 15\xB0C \u2014 cooler than the surface due to altitude",
          moisture_level: "High \u2014 the reef captures and retains cloud moisture, creating its own micro-rain cycle",
          elevation_range: "3000-5000m above the surface, shifting with atmospheric conditions",
          dominant_terrain: "Interconnected floating rock fragments covered in layered growth \u2014 lichen crusts, moss beds, aerial root networks, and flowering vines. Open sky between major reef masses.",
          carrying_capacity: "Moderate \u2014 limited by available surface area and nutrient input from atmospheric dust and captured precipitation"
        }
      },
      {
        id: "bone_forest",
        name: "Bone Forest",
        description: "Trees made of calcite growing from fossil-rich soil. White, brittle, and eerily beautiful.",
        element_type: "forest",
        summary: "A forest of pale, mineral trees growing from ancient bone deposits \u2014 hauntingly beautiful and eerily silent",
        detailed_notes: 'The Bone Forest is a biome where the boundary between geology and biology has blurred beyond recognition. The "trees" are columnar formations of living calcite \u2014 mineral structures that grow from the fossil-rich substrate by drawing dissolved calcium carbonate upward through capillary action and precipitating it into trunk-like pillars and branch-like formations. They are not alive in the biological sense, yet they grow, respond to moisture, and even "reproduce" by shedding mineral fragments that seed new formations. The forest is blindingly white, the calcite reflecting sunlight with a bone-like pallor. The formations are brittle \u2014 a strong wind can snap smaller "branches," sending them crashing to the ground with a sound like breaking porcelain. The forest floor is a carpet of calcite fragments, and walking through it produces a continuous crunching. Despite the lack of biological trees, an ecosystem has developed: lichens colonize the calcite surfaces, insects bore into softer mineral deposits, and small mammals shelter in the hollow cores of older formations. The silence is notable \u2014 with no leaves to rustle and no wood to creak, the Bone Forest is one of the quietest places on the planet.',
        fields: {
          biome_type: "forest",
          temperature_range: "5\xB0C to 35\xB0C \u2014 the white calcite reflects heat, keeping the interior cooler than surrounding terrain",
          moisture_level: "Low to moderate \u2014 the calcite formations draw moisture from the soil, leaving the air relatively dry",
          elevation_range: "200-800m",
          terrain_description: "Dense clusters of white calcite columns ranging from 2 to 30 meters tall, with branching mineral formations creating a canopy-like structure. The ground is a thick layer of calcite fragments over fossil-rich sediment."
        }
      },
      {
        id: "mirror_lake_biome",
        name: "Mirror Lake Biome",
        description: "A biome around a lake so reflective it perfectly doubles the sky \u2014 disorienting and sacred.",
        element_type: "wetland",
        summary: "A disorienting wetland surrounding a perfectly reflective lake that doubles the sky",
        detailed_notes: "The Mirror Lake Biome is centered on a body of water so still and so reflective that it creates a perfect duplicate of the sky on its surface. The effect is profoundly disorienting: at the lake's edge, it becomes impossible to distinguish up from down, and the horizon dissolves into a seamless sphere of sky. Birds have been observed diving into the lake's surface, mistaking it for open air. The reflectivity is caused by an unusual combination of factors: the lake is extraordinarily shallow (rarely exceeding one meter), its bed is composed of a white clay that acts as a perfect backing, and a film of mineral oils from surrounding geological seeps creates a surface tension that eliminates all ripples. The surrounding wetland has adapted to the lake's presence \u2014 vegetation grows low and outward rather than upward, as though the biome itself is trying to minimize its disruption of the mirror effect. The biome is sacred to many cultures, who see the doubled sky as a gateway to a spirit realm or a reflection of the divine.",
        fields: {
          biome_type: "wetland",
          temperature_range: "8\xB0C to 28\xB0C \u2014 moderated by the lake's thermal mass",
          moisture_level: "High \u2014 saturated ground surrounds the lake, supporting dense low vegetation",
          elevation_range: "50-200m (the lake occupies a broad, shallow depression)",
          dominant_terrain: "A vast, shallow lake surrounded by concentric rings of low marsh vegetation, mineral mudflats, and sedge meadows. The transition from water to land is gradual and ambiguous.",
          carrying_capacity: "Moderate \u2014 rich in waterbirds, amphibians, and aquatic invertebrates, but the shallow water limits fish diversity"
        }
      },
      {
        id: "rust_waste",
        name: "Rust Waste",
        description: "Oxidized metal landscape, remnant of ancient industrial civilization.",
        element_type: "desert",
        summary: "A barren expanse of oxidized metal \u2014 the corroded remains of a fallen industrial civilization",
        detailed_notes: "The Rust Waste is what remains when a technologically advanced civilization collapses and its infrastructure decays over millennia. The landscape is dominated by oxidized metal: the ground is a crust of iron oxide giving everything a deep red-orange hue, punctuated by the skeletal remains of structures too massive to fully corrode \u2014 collapsed frameworks, half-buried machinery, and columns of an unidentifiable alloy that still resist the rust. The soil is toxic with heavy metals, and groundwater is contaminated with dissolved iron, copper, and more exotic industrial byproducts. Despite the toxicity, life has adapted. Rust-tolerant lichens and iron-metabolizing bacteria form the base of a sparse food chain, and a few hardy arthropod species have evolved to extract nutrients from the corroded metal. The Waste serves as a cautionary landscape \u2014 a reminder of what unchecked industry leaves behind. Scavengers and archaeologists pick through the ruins seeking salvageable technology, but the toxic environment limits expeditions to days at most.",
        fields: {
          biome_type: "desert",
          temperature_range: "-10\xB0C to 55\xB0C \u2014 the dark metal surfaces absorb and radiate heat intensely",
          moisture_level: "Extremely low \u2014 toxic runoff has poisoned most natural water sources",
          elevation_range: "100-600m (relatively flat, with occasional mounds of collapsed superstructures)",
          dominant_terrain: "Flat expanses of iron oxide crust broken by jutting remnants of ancient metal structures. Shallow pools of rust-colored, acidic water collect in depressions. Wind-sculpted dunes of metal flakes accumulate against the larger ruins.",
          carrying_capacity: "Very low \u2014 heavy metal toxicity limits all biological activity. Only extremophile organisms persist."
        }
      }
    ],
    defaultSortField: "biome_type"
  };

  // src/domains/flora.ts
  var floraConfig = {
    id: "flora",
    name: "Flora",
    namePlural: "Flora",
    icon: "leaf",
    color: "#27ae60",
    description: "Catalog the plants, fungi, algae, and other sessile organisms of your world. From towering world-trees to bioluminescent mushrooms, flora forms the foundation of every food chain and many economies.",
    tableName: "flora",
    category: "natural",
    fields: [
      {
        name: "kingdom",
        label: "Kingdom",
        type: "select",
        required: true,
        options: ["plant", "fungus", "algae", "custom"],
        helpText: "The biological kingdom this organism belongs to."
      },
      {
        name: "growth_form",
        label: "Growth Form",
        type: "select",
        required: true,
        options: ["tree", "shrub", "grass", "vine", "moss", "aquatic", "fungal"],
        helpText: "The physical growth habit of this organism."
      },
      {
        name: "max_height",
        label: "Maximum Height",
        type: "text",
        placeholder: "e.g. 30m, 2cm, towering",
        helpText: "The tallest this species typically grows."
      },
      {
        name: "lifespan",
        label: "Lifespan",
        type: "text",
        placeholder: "e.g. 500 years, annual, immortal",
        helpText: "Typical lifespan of an individual organism."
      },
      {
        name: "reproduction_method",
        label: "Reproduction Method",
        type: "text",
        placeholder: "e.g. spores, seeds, rhizome, budding",
        helpText: "How this species reproduces and spreads."
      },
      {
        name: "uses",
        label: "Uses",
        type: "json",
        placeholder: '["food", "medicine", "timber", "dye", "poison"]',
        helpText: "Practical uses for this organism\u2014food, medicine, materials, etc."
      },
      {
        name: "rarity",
        label: "Rarity",
        type: "select",
        options: ["common", "uncommon", "rare", "very_rare", "unique"],
        helpText: "How commonly this species is found in the wild."
      },
      {
        name: "sentient",
        label: "Sentient",
        type: "boolean",
        helpText: "Whether this species possesses any form of awareness or intelligence."
      },
      {
        name: "seasonal_behavior",
        label: "Seasonal Behavior",
        type: "textarea",
        placeholder: "Describe deciduous/evergreen cycles, dormancy, bloom timing...",
        helpText: "How this species changes through the seasons \u2014 leaf drop, dormancy, flowering, fruiting cycles."
      },
      {
        name: "cultivation_difficulty",
        label: "Cultivation Difficulty",
        type: "select",
        options: ["wild_only", "difficult", "moderate", "easy", "domesticated"],
        helpText: "How difficult it is to cultivate or farm this species."
      },
      {
        name: "endangered_status",
        label: "Endangered Status",
        type: "select",
        options: ["thriving", "stable", "declining", "endangered", "critical", "extinct_in_wild"],
        helpText: "The current population health and conservation status of this species."
      },
      {
        name: "habitat_description",
        label: "Habitat Description",
        type: "textarea",
        placeholder: "Describe preferred growing conditions, soil, light, moisture...",
        helpText: "Prose description of habitat preferences \u2014 where and how this species grows."
      },
      {
        name: "biome_ids",
        label: "Native Biomes",
        type: "json",
        placeholder: '["forest_biome_1", "wetland_biome_3"]',
        helpText: "Biomes where this species naturally occurs."
      }
    ],
    elementTypes: ["tree", "shrub", "grass", "vine", "moss", "aquatic_plant", "fungus", "algae", "custom"],
    elementTypeDescriptions: {
      tree: "A tall, woody perennial plant with a central trunk and branching canopy. Foundation of forests and source of timber, fruit, and shelter.",
      shrub: "A woody plant smaller than a tree, often multi-stemmed. Forms undergrowth, hedgerows, and scrublands.",
      grass: "A low-growing plant with narrow leaves, forming meadows, prairies, and lawns. Includes cereal crops that feed civilizations.",
      vine: "A climbing or trailing plant that uses other structures for support. Can blanket forests, walls, or ruins.",
      moss: "A small, non-vascular plant that grows in dense green mats on moist surfaces. Among the oldest land plants.",
      aquatic_plant: "A plant adapted to life in or on water \u2014 rooted in riverbeds, floating on lakes, or drifting in open ocean.",
      fungus: "A spore-producing organism that feeds on organic matter. Includes mushrooms, molds, and vast underground mycelial networks.",
      algae: "A simple photosynthetic organism found in water or damp environments. Ranges from single-celled to massive kelp forests.",
      custom: "A plant or plant-like organism that doesn't fit standard categories \u2014 something unique to your world."
    },
    prompts: [
      "What staple crops feed your world's civilizations? Were they domesticated, magically bred, or gifted by gods?",
      "Are there plants with unusual properties\u2014carnivorous trees, luminous flowers, or fungi that form vast underground networks?",
      "How do seasons affect plant life? Are there species that bloom only during eclipses, mana surges, or once per century?",
      "What role do forests play in your world's mythology, politics, and warfare?",
      "Are there plants that have gone extinct, and what consequences has their loss had on ecosystems?"
    ],
    magicPermeation: {
      companionTable: "flora_magic_aspects",
      fields: [
        {
          name: "magical_properties",
          label: "Magical Properties",
          type: "textarea",
          helpText: "Inherent magical properties of this species\u2014glowing, warding, healing aura, etc."
        },
        {
          name: "mana_interaction",
          label: "Mana Interaction",
          type: "select",
          options: ["none", "absorber", "producer", "conductor", "storage", "converter", "dampener"],
          helpText: "How this species interacts with ambient mana."
        },
        {
          name: "mana_production_rate",
          label: "Mana Production Rate",
          type: "text",
          placeholder: "e.g. low, moderate, high",
          helpText: "If a producer, how much mana this species generates."
        },
        {
          name: "use_in_potions",
          label: "Use in Potions",
          type: "textarea",
          helpText: "How parts of this organism are used in potion-making and alchemy."
        },
        {
          name: "use_as_reagent",
          label: "Use as Reagent",
          type: "textarea",
          helpText: "How this species serves as a spell component or magical reagent."
        },
        {
          name: "sentience_level",
          label: "Magical Sentience Level",
          type: "select",
          options: ["none", "reactive", "semi_sentient", "sentient", "sapient"],
          helpText: "The degree of magical awareness or consciousness."
        },
        {
          name: "communication_method",
          label: "Communication Method",
          type: "textarea",
          helpText: "How sentient or semi-sentient flora communicates\u2014pheromones, telepathy, root networks, etc."
        },
        {
          name: "magical_symbiosis",
          label: "Magical Symbiosis",
          type: "textarea",
          helpText: "Magical symbiotic relationships with other organisms or magical fields."
        },
        {
          name: "cultivation_requirements_magical",
          label: "Magical Cultivation Requirements",
          type: "textarea",
          helpText: "Special magical conditions needed to grow or cultivate this species."
        },
        {
          name: "magical_life_cycle",
          label: "Magical Life Cycle",
          type: "textarea",
          helpText: "Stages of the life cycle that are magical in nature\u2014mana-bloom, arcane fruiting, etc."
        },
        {
          name: "toxicity_magical",
          label: "Magical Toxicity",
          type: "textarea",
          helpText: "Magical poisons, curses, or harmful effects produced by this species."
        },
        {
          name: "magic_relevance",
          label: "Magic Relevance",
          type: "select",
          options: ["none", "minor", "moderate", "major", "fundamental"],
          helpText: "How central magic is to this species' biology and role."
        },
        {
          name: "custom_magic_notes",
          label: "Custom Magic Notes",
          type: "textarea",
          placeholder: "Any additional notes about magical aspects...",
          helpText: "Free-form notes on magical properties not covered above."
        }
      ],
      manaSensitivity: "reactive",
      planeAware: false,
      prompts: [
        "Do certain plants absorb, store, or produce mana? Has this made them targets for harvesting or cultivation by mages?",
        "Are there sentient or semi-sentient plant species that communicate through magical root networks or telepathy?",
        "What alchemical or potion ingredients come from your world's flora? Are any dangerously addictive, forbidden, or extinct?"
      ]
    },
    archetypes: [
      {
        id: "ancient_hardwood",
        name: "Ancient Hardwood",
        description: "A massive, slow-growing tree that can live for millennia and forms the backbone of old-growth forests.",
        element_type: "tree",
        summary: "A towering ancient tree prized for its wood and ecological importance",
        fields: {
          kingdom: "plant",
          growth_form: "tree",
          max_height: "40-60 meters",
          lifespan: "1000-5000 years",
          rarity: "uncommon",
          cultivation_difficulty: "difficult",
          endangered_status: "declining",
          seasonal_behavior: "Deciduous in temperate climates, shedding leaves in autumn. Spring growth is slow but produces extremely dense, valuable wood."
        }
      },
      {
        id: "staple_grain",
        name: "Staple Grain",
        description: "A cultivated grass that feeds nations \u2014 the foundation of agriculture and civilization.",
        element_type: "grass",
        summary: "A domesticated cereal crop central to agriculture",
        fields: {
          kingdom: "plant",
          growth_form: "grass",
          max_height: "1-2 meters",
          lifespan: "Annual (one growing season)",
          rarity: "common",
          cultivation_difficulty: "domesticated",
          endangered_status: "thriving",
          seasonal_behavior: "Planted in spring, harvested in late summer or autumn. Requires fertile soil and adequate rainfall or irrigation."
        }
      },
      {
        id: "medicinal_herb",
        name: "Medicinal Herb",
        description: "A small plant with potent curative properties, gathered by healers and herbalists.",
        element_type: "shrub",
        summary: "A valued healing plant sought by herbalists and apothecaries",
        fields: {
          kingdom: "plant",
          growth_form: "shrub",
          max_height: "0.3-1 meter",
          lifespan: "Perennial (5-20 years)",
          rarity: "uncommon",
          cultivation_difficulty: "moderate",
          endangered_status: "stable",
          seasonal_behavior: "Flowers in midsummer when medicinal compounds are at peak concentration. Must be harvested at the right lunar phase for full potency (according to folk tradition)."
        }
      },
      {
        id: "carnivorous_plant",
        name: "Carnivorous Plant",
        description: "A predatory plant that supplements poor soil nutrition by trapping and digesting small creatures.",
        element_type: "shrub",
        summary: "A predatory plant that lures and digests prey",
        fields: {
          kingdom: "plant",
          growth_form: "shrub",
          max_height: "0.5-3 meters",
          lifespan: "20-100 years",
          rarity: "rare",
          cultivation_difficulty: "difficult",
          endangered_status: "stable",
          seasonal_behavior: "Most active during warm, humid months when insect prey is abundant. Traps may close or go dormant in cold seasons."
        }
      },
      {
        id: "cave_fungus",
        name: "Cave Fungus",
        description: "A bioluminescent fungus that carpets underground surfaces, providing faint light in the deep dark.",
        element_type: "fungus",
        summary: "A glowing underground fungus illuminating the deep places of the world",
        fields: {
          kingdom: "fungus",
          growth_form: "fungal",
          max_height: "0.01-0.3 meters",
          lifespan: "Colony can persist indefinitely",
          rarity: "uncommon",
          cultivation_difficulty: "difficult",
          endangered_status: "stable",
          habitat_description: "Found on damp cave walls and rotting wood in underground environments. Requires complete darkness and high humidity."
        }
      },
      {
        id: "wandering_grove",
        name: "Wandering Grove",
        description: "A tree that migrates \u2014 its root system slowly pulls it across the landscape over decades, following water or ley lines.",
        element_type: "tree",
        summary: "A slow-walking tree that migrates across the landscape over centuries",
        fields: {
          kingdom: "plant",
          growth_form: "tree",
          max_height: "15-25 meters",
          lifespan: "Thousands of years \u2014 individual trees have been tracked across continents",
          rarity: "rare",
          cultivation_difficulty: "wild_only",
          endangered_status: "declining",
          seasonal_behavior: 'Movement accelerates in spring when groundwater is abundant. The tree "walks" by extending roots forward and retracting them behind, moving 2-5 meters per year. Groves migrate together in loose formations.',
          habitat_description: "Found in open grasslands and sparse woodlands where root-travel is unobstructed. Ancient paths of compacted soil mark routes used for millennia. Some civilizations track grove movements to predict water table shifts."
        }
      },
      {
        id: "dreaming_lotus",
        name: "Dreaming Lotus",
        description: "An aquatic flower whose pollen induces shared visions in nearby sleepers \u2014 a natural psychic network.",
        element_type: "aquatic_plant",
        summary: "A psychoactive water lily that links the dreams of those who sleep near it",
        fields: {
          kingdom: "plant",
          growth_form: "aquatic",
          max_height: "0.1 meters above waterline, root systems extend 3m down",
          lifespan: "Individual flowers: one lunar cycle. Root colony: centuries",
          rarity: "very_rare",
          cultivation_difficulty: "difficult",
          endangered_status: "endangered",
          seasonal_behavior: "Blooms only during full moons. Pollen release peaks at midnight. Those sleeping within 100 meters of a blooming colony share a vivid dreamscape shaped by the lotus. Cultures that understand this use it for councils, therapy, or espionage."
        }
      },
      {
        id: "singing_tree",
        name: "Singing Tree",
        description: "A tree whose hollow branches produce haunting music when wind passes through them. Culturally sacred, often found near temples.",
        element_type: "tree",
        summary: "A wind-instrument tree that produces eerie, beautiful melodies revered by many cultures",
        detailed_notes: "The Singing Tree develops naturally hollow branches with precisely shaped apertures that act as flutes and resonating chambers. Different wind speeds and directions produce different harmonies, and no two trees sound alike. Many religions consider these trees to be the voices of gods or ancestors. Temple groves are carefully cultivated so that the combined sound of dozens of trees creates complex, ever-changing symphonies. The wood, if harvested, makes superlative musical instruments \u2014 but cutting a Singing Tree is taboo in most cultures.",
        fields: {
          kingdom: "plant",
          growth_form: "tree",
          max_height: "20-35 meters",
          lifespan: "300-800 years",
          rarity: "rare",
          uses: ["musical instruments", "sacred groves", "temple construction", "meditation"],
          cultivation_difficulty: "difficult",
          endangered_status: "declining",
          seasonal_behavior: "Branches hollow out gradually as the tree matures, with the first audible tones emerging around age 50. In autumn, falling leaves alter the acoustic profile, producing deeper, more mournful tones. Spring growth temporarily mutes some chambers until new wood hardens.",
          habitat_description: "Prefers exposed ridgelines, hilltops, and open valleys where wind is reliable. Temple groundskeepers carefully manage surrounding vegetation to shape wind flow."
        }
      },
      {
        id: "corpse_bloom",
        name: "Corpse Bloom",
        description: "A massive flower that only grows from decomposing organic matter. Beautiful and unsettling, used in funerary rites.",
        element_type: "shrub",
        summary: "A gorgeous but macabre flower that blooms exclusively from death and decay",
        detailed_notes: "The Corpse Bloom is both revered and feared. Its seeds remain dormant in soil for decades until they detect the chemical signature of significant decomposition \u2014 a large animal carcass or, notably, a humanoid burial. Within weeks, a spectacular flower emerges: deep crimson petals veined with iridescent gold, sometimes reaching a meter across. The bloom is intensely fragrant, smelling paradoxically of honey and rain rather than rot. Many cultures have adopted the Corpse Bloom into funerary traditions, planting seeds with the dead so that beauty literally rises from loss. Others consider it an ill omen, a sign that death has visited unseen.",
        fields: {
          kingdom: "plant",
          growth_form: "shrub",
          max_height: "0.5-1.5 meters",
          lifespan: "Individual bloom: 2-4 weeks. Seeds viable for decades in dormancy.",
          rarity: "uncommon",
          uses: ["funerary rites", "perfume", "dye", "memorial gardens"],
          cultivation_difficulty: "difficult",
          endangered_status: "stable",
          seasonal_behavior: "Not governed by seasons but by the availability of decomposing matter. Can bloom at any time of year. After flowering, produces dark seed pods that scatter in wind, lying dormant until triggered by decay chemistry.",
          habitat_description: "Found in battlefields, ancient graveyards, forest floors where large animals have died, and compost-rich areas near settlements. Thrives in moist, nutrient-dense soil."
        }
      },
      {
        id: "iron_root",
        name: "Iron Root",
        description: "A plant whose roots extract and concentrate metal from soil, producing metallic nodules. Used in primitive smelting.",
        element_type: "tree",
        summary: "A metallophyte tree that mines ore from the earth through its root system",
        detailed_notes: "The Iron Root is a hyperaccumulator \u2014 a tree that draws dissolved metals from groundwater and soil, concentrating them in dense nodules along its root system and at the base of its trunk. Over decades, a mature Iron Root can produce hundreds of kilograms of metal-rich nodules that are significantly easier to smelt than raw ore. Early civilizations discovered that harvesting these nodules was far simpler than mining, and some scholars argue that the Iron Root was the catalyst for the first metal-working cultures. The tree itself suffers no ill effects from the metal concentration; indeed, the metallic deposits in its bark make it highly resistant to pests, fire, and even axe blows.",
        fields: {
          kingdom: "plant",
          growth_form: "tree",
          max_height: "10-20 meters",
          lifespan: "200-500 years",
          rarity: "uncommon",
          uses: ["ore extraction", "primitive smelting", "soil remediation", "armor-grade timber"],
          cultivation_difficulty: "moderate",
          endangered_status: "declining",
          seasonal_behavior: "Metal accumulation is fastest during the wet season when dissolved minerals are most available in groundwater. In autumn, the tree sheds metallic-tinged leaves that glitter like coins \u2014 a reliable sign of mineral-rich soil beneath.",
          habitat_description: "Found in regions with mineral-rich subsoil, particularly near ore deposits, volcanic terrain, and ancient riverbeds. The presence of Iron Roots is used by prospectors as a reliable indicator of underground mineral wealth."
        }
      },
      {
        id: "memory_moss",
        name: "Memory Moss",
        description: "A moss that records sounds and replays them when touched. Used for record-keeping.",
        element_type: "moss",
        summary: "A remarkable moss that absorbs and replays ambient sounds, serving as a living recording medium",
        detailed_notes: 'Memory Moss is a small, velvety organism that has evolved the extraordinary ability to encode sound vibrations into its cellular structure and replay them when physically stimulated. The moss grows in soft, dense mats on damp stone surfaces, and its cells contain a unique crystalline organelle that vibrates in response to sound waves, locking the vibration pattern into a semi-permanent molecular configuration. When the moss is touched \u2014 pressed, stroked, or squeezed \u2014 it releases the stored vibrations as audible sound, replaying whatever it last "heard" with remarkable fidelity. The recordings degrade over time, with older sounds becoming faint and distorted, but fresh recordings can persist for weeks or months. Cultures that have discovered this property use cultivated Memory Moss for record-keeping, message relay, and legal testimony. Moss-scribes carefully tend patches of Memory Moss, dictating records into them and storing the living mats in climate-controlled archives. Wild Memory Moss in old ruins can sometimes be coaxed into replaying the voices of people dead for centuries.',
        fields: {
          kingdom: "plant",
          growth_form: "moss",
          max_height: "0.5-3 cm",
          lifespan: "Individual patches: 5-15 years. Colonies can persist indefinitely through vegetative growth.",
          rarity: "rare",
          uses: ["record-keeping", "message relay", "legal testimony", "archaeological research", "musical composition"]
        }
      },
      {
        id: "blood_oak",
        name: "Blood Oak",
        description: "A tree with red sap used medicinally. Over-harvesting threatens it.",
        element_type: "tree",
        summary: "A massive tree that bleeds crimson sap prized for its potent medicinal properties",
        detailed_notes: "The Blood Oak is a towering hardwood distinguished by its deep red sap \u2014 a thick, viscous fluid that oozes from cuts in the bark like blood from a wound. The sap contains a complex cocktail of bioactive compounds with remarkable medicinal properties: it accelerates wound healing, reduces fever, fights infection, and \u2014 in concentrated doses \u2014 can even slow the progression of certain poisons and diseases. For these reasons, Blood Oak sap is one of the most valuable natural substances in the world, commanding prices that rival precious metals. This value has driven aggressive harvesting. Tappers score the bark deeply and repeatedly, weakening trees and leaving them vulnerable to disease and wind damage. Old-growth Blood Oaks that once dominated temperate forests are now rare, surviving mainly in protected groves maintained by healer guilds and religious orders. The tree grows slowly and takes decades to reach sap-producing maturity, making recovery from over-harvesting a generational project.",
        fields: {
          kingdom: "plant",
          growth_form: "tree",
          max_height: "25-40 meters",
          lifespan: "400-1200 years",
          rarity: "rare",
          uses: ["medicine", "wound treatment", "fever reduction", "antitoxin base", "sacred rites"],
          cultivation_difficulty: "difficult",
          endangered_status: "endangered",
          seasonal_behavior: "Sap flow peaks in early spring as the tree breaks dormancy, making this the primary harvesting season. Autumn brings deep red foliage that is visually indistinguishable from the sap-stained bark, camouflaging tap wounds.",
          habitat_description: "Native to temperate old-growth forests with deep, moist soil. Requires decades of undisturbed growth to reach maturity. Surviving groves are fiercely protected by local communities and healer orders."
        }
      },
      {
        id: "spore_tower",
        name: "Spore Tower",
        description: "A massive fungal column releasing clouds of spores seasonally.",
        element_type: "fungus",
        summary: "A colossal fungal column that towers above the canopy, releasing vast clouds of spores that reshape the surrounding landscape",
        detailed_notes: `The Spore Tower is among the largest single organisms in the world \u2014 a fungal fruiting body that can reach 40 meters in height and 8 meters in diameter at the base. It grows from a mycelial network that may extend for kilometers underground, and its sole purpose is the production and dispersal of spores. During the sporulation season, the Tower's upper chambers split open and release billowing clouds of spores so dense they blot out the sun and coat everything within miles in a fine, powdery layer. The spore clouds are visible from enormous distances as pillar-shaped plumes rising from the canopy. The ecological impact is immense: the spores serve as food for insects and filter-feeding organisms, as fertilizer when they decompose, and as the reproductive medium for new Spore Tower colonies. However, the spore clouds are a respiratory hazard for larger organisms, and settlements downwind of a Tower must seal their buildings during sporulation or face widespread "spore lung" infection.`,
        fields: {
          kingdom: "fungus",
          growth_form: "fungal",
          max_height: "20-40 meters",
          lifespan: "Individual fruiting body: 50-200 years. Underlying mycelial network: potentially thousands of years.",
          rarity: "uncommon",
          uses: ["fertilizer", "insect feed", "alchemical reagent", "building material (dried stalk)"],
          cultivation_difficulty: "wild_only",
          endangered_status: "stable",
          seasonal_behavior: "Sporulation occurs once annually, typically triggered by the first heavy rains after a dry period. The event lasts 3-7 days and is preceded by visible swelling of the upper chambers. Post-sporulation, the Tower enters a dormant growth phase, slowly regenerating its spore reserves over the following year.",
          habitat_description: "Found in humid forests and wetlands with deep organic soil layers. Requires extensive underground mycelial territory and abundant decaying matter. Often grows near water sources where moisture sustains the massive fruiting body."
        }
      }
    ],
    defaultSortField: "kingdom"
  };

  // src/domains/fauna.ts
  var faunaConfig = {
    id: "fauna",
    name: "Fauna",
    namePlural: "Fauna",
    icon: "paw-print",
    color: "#e67e22",
    description: "Catalog the animals, beasts, and creatures of your world\u2014from mundane livestock to apex predators to legendary monsters. Fauna fills every ecological niche and shapes how civilizations live, fight, and travel.",
    tableName: "fauna",
    category: "natural",
    fields: [
      {
        name: "body_type",
        label: "Body Type",
        type: "text",
        placeholder: "e.g. quadruped, serpentine, avian, amorphous",
        helpText: "The general body plan and morphology of this creature."
      },
      {
        name: "diet",
        label: "Diet",
        type: "select",
        required: true,
        options: ["herbivore", "carnivore", "omnivore", "filter_feeder", "photosynthetic", "detritivore", "custom"],
        helpText: "What this creature eats."
      },
      {
        name: "locomotion",
        label: "Locomotion",
        type: "json",
        placeholder: '["walking", "flying", "swimming"]',
        helpText: "Methods of movement this creature uses."
      },
      {
        name: "max_size",
        label: "Maximum Size",
        type: "text",
        placeholder: "e.g. 3m long, 500kg, colossal",
        helpText: "The largest size an adult of this species reaches."
      },
      {
        name: "lifespan",
        label: "Lifespan",
        type: "text",
        placeholder: "e.g. 80 years, 3 months, ageless",
        helpText: "Typical natural lifespan."
      },
      {
        name: "intelligence_level",
        label: "Intelligence Level",
        type: "select",
        required: true,
        options: ["instinctive", "animal", "clever", "near_sentient", "sentient"],
        helpText: "The cognitive capability of this species."
      },
      {
        name: "social_structure",
        label: "Social Structure",
        type: "text",
        placeholder: "e.g. solitary, pack, herd, hive, family unit",
        helpText: "How individuals of this species organize socially."
      },
      {
        name: "rarity",
        label: "Rarity",
        type: "select",
        options: ["common", "uncommon", "rare", "very_rare", "unique"],
        helpText: "How commonly this species is encountered in its native habitat."
      },
      {
        name: "domesticable",
        label: "Domesticable",
        type: "boolean",
        helpText: "Whether this species can be tamed or domesticated by sentient beings."
      },
      {
        name: "migration_pattern",
        label: "Migration Pattern",
        type: "textarea",
        placeholder: "Describe seasonal movements, routes, triggers...",
        helpText: "Seasonal or cyclical movement patterns \u2014 routes, timing, and what triggers migration."
      },
      {
        name: "habitat_niche",
        label: "Habitat Niche",
        type: "text",
        placeholder: "e.g. forest canopy, deep ocean floor, cave systems",
        helpText: "The specific microhabitat this species occupies within its biome."
      },
      {
        name: "communication",
        label: "Communication",
        type: "textarea",
        placeholder: "Describe calls, songs, pheromones, displays...",
        helpText: "How this species communicates \u2014 vocalizations, chemical signals, visual displays, etc."
      },
      {
        name: "habitat_description",
        label: "Habitat Description",
        type: "textarea",
        placeholder: "Describe preferred environment, shelter, territory needs...",
        helpText: "Prose description of habitat preferences beyond biome classification."
      },
      {
        name: "biome_ids",
        label: "Native Biomes",
        type: "json",
        placeholder: '["forest_biome_1", "grassland_biome_2"]',
        helpText: "Biomes where this species is naturally found."
      }
    ],
    elementTypes: ["mammal", "reptile", "bird", "fish", "insect", "amphibian", "invertebrate", "mythical_beast", "custom"],
    elementTypeDescriptions: {
      mammal: "A warm-blooded vertebrate with hair or fur that nurses its young with milk. Includes predators, livestock, and companion animals.",
      reptile: "A cold-blooded, scaly vertebrate that lays eggs or bears live young. Includes lizards, snakes, turtles, and dragons.",
      bird: "A feathered, warm-blooded vertebrate with wings. Most can fly, and they fill roles from predator to messenger to sacred symbol.",
      fish: "A cold-blooded aquatic vertebrate that breathes through gills. Inhabits oceans, rivers, and lakes in enormous variety.",
      insect: "A six-legged arthropod, often winged. The most numerous animals on any world \u2014 pollinators, pests, hive-builders, and decomposers.",
      amphibian: "A vertebrate that typically lives in water as a larva and on land as an adult. Sensitive to environmental changes.",
      invertebrate: "An animal without a backbone \u2014 worms, mollusks, crustaceans, jellyfish, and more. Diverse and ecologically essential.",
      mythical_beast: "A creature of legend \u2014 dragons, griffins, basilisks, or beings unique to your world that defy natural classification.",
      custom: "A creature that doesn't fit standard categories \u2014 something unique to your world's biology."
    },
    prompts: [
      "What creatures serve as beasts of burden, mounts, or companions? How were they domesticated, and what do they need?",
      "What apex predators sit at the top of your food chains? How do civilizations defend against or coexist with them?",
      "Are there migratory species whose movements mark the seasons or create hazards for travelers?",
      "What creatures have gone extinct in your world, and what ecological or cultural impacts did their loss cause?",
      "How have sentient species bred, modified, or engineered animals for war, labor, entertainment, or companionship?"
    ],
    magicPermeation: {
      companionTable: "fauna_magic_aspects",
      fields: [
        {
          name: "innate_magical_abilities",
          label: "Innate Magical Abilities",
          type: "textarea",
          helpText: "Magical powers this species naturally possesses\u2014breath weapons, illusions, phasing, etc."
        },
        {
          name: "mana_interaction",
          label: "Mana Interaction",
          type: "select",
          options: ["none", "absorber", "producer", "conductor", "storage", "converter", "dampener"],
          helpText: "How this species interacts with ambient mana."
        },
        {
          name: "magical_classification",
          label: "Magical Classification",
          type: "select",
          options: ["mundane", "mana_touched", "magical_beast", "arcane_creature", "elemental", "construct", "undead", "planar", "divine", "custom"],
          helpText: "Where this creature falls in the magical taxonomy."
        },
        {
          name: "familiar_potential",
          label: "Familiar Potential",
          type: "boolean",
          helpText: "Whether this species can serve as a wizard's familiar."
        },
        {
          name: "familiar_bond_type",
          label: "Familiar Bond Type",
          type: "text",
          placeholder: "e.g. telepathic, empathic, mana-shared",
          helpText: "The nature of the magical bond when this creature serves as a familiar."
        },
        {
          name: "summonable",
          label: "Summonable",
          type: "boolean",
          helpText: "Whether this creature can be magically summoned."
        },
        {
          name: "summoning_requirements",
          label: "Summoning Requirements",
          type: "textarea",
          helpText: "What is needed to summon this creature\u2014rituals, reagents, conditions."
        },
        {
          name: "magical_materials_harvestable",
          label: "Harvestable Magical Materials",
          type: "textarea",
          helpText: "Magical components that can be harvested\u2014scales, blood, venom, heartstone, etc."
        },
        {
          name: "mana_diet",
          label: "Feeds on Mana",
          type: "boolean",
          helpText: "Whether this creature partially or wholly sustains itself on magical energy."
        },
        {
          name: "magical_evolution_path",
          label: "Magical Evolution Path",
          type: "textarea",
          helpText: "How exposure to magic can cause this species to evolve or transform over generations."
        },
        {
          name: "intelligence_magical",
          label: "Magical Intelligence",
          type: "textarea",
          helpText: "How magic enhances or grants intelligence beyond the species' natural level."
        },
        {
          name: "domestication_magical",
          label: "Magical Domestication",
          type: "textarea",
          helpText: "Special magical methods required to tame or bond with this creature."
        },
        {
          name: "native_plane_id",
          label: "Native Plane",
          type: "text",
          placeholder: "ID of the creature's plane of origin",
          helpText: "If extraplanar, the plane this creature originates from."
        },
        {
          name: "magic_relevance",
          label: "Magic Relevance",
          type: "select",
          options: ["none", "minor", "moderate", "major", "fundamental"],
          helpText: "How central magic is to this species' existence and behavior."
        },
        {
          name: "custom_magic_notes",
          label: "Custom Magic Notes",
          type: "textarea",
          placeholder: "Any additional notes about magical aspects...",
          helpText: "Free-form notes on magical properties not covered above."
        }
      ],
      manaSensitivity: "active",
      planeAware: true,
      prompts: [
        "Which creatures have innate magical abilities? Did they evolve these powers naturally, or were they shaped by ancient enchantments?",
        "Can magical creatures serve as familiars, mounts, or guardians? What kind of bond forms between creature and mage?",
        "Are there creatures that feed on mana itself? How does their presence affect the magical ecosystem around them?"
      ]
    },
    archetypes: [
      {
        id: "apex_predator",
        name: "Apex Predator",
        description: "A dominant carnivore at the top of its food chain \u2014 feared, respected, and ecologically vital.",
        element_type: "mammal",
        summary: "A powerful top predator that shapes the ecosystem through fear and predation",
        fields: {
          body_type: "Large quadruped, muscular build",
          diet: "carnivore",
          max_size: "3-5 meters, 200-600 kg",
          lifespan: "20-40 years",
          intelligence_level: "clever",
          social_structure: "Solitary or small family groups with large territories",
          rarity: "uncommon",
          domesticable: false,
          habitat_niche: "Dominant predator of open and forested terrain",
          communication: "Roars, scent marking, and body language to establish territory. Vocalizations can carry for kilometers."
        }
      },
      {
        id: "beast_of_burden",
        name: "Beast of Burden",
        description: "A strong, domesticated animal used for hauling, plowing, or riding.",
        element_type: "mammal",
        summary: "A strong domesticated animal essential to agriculture and transport",
        fields: {
          body_type: "Large quadruped, heavy-boned",
          diet: "herbivore",
          max_size: "2-3 meters tall, 500-1000 kg",
          lifespan: "25-40 years",
          intelligence_level: "animal",
          social_structure: "Herd animal, bonds with handlers",
          rarity: "common",
          domesticable: true,
          habitat_niche: "Grasslands and farmland",
          communication: "Low vocalizations, ear and tail positioning, stamping."
        }
      },
      {
        id: "migratory_herder",
        name: "Migratory Herder",
        description: "A gregarious herbivore that travels in vast herds following seasonal food sources.",
        element_type: "mammal",
        summary: "A herd animal whose mass migrations reshape the landscape",
        fields: {
          body_type: "Medium quadruped, built for endurance",
          diet: "herbivore",
          max_size: "1.5-2 meters at shoulder, 200-400 kg",
          lifespan: "15-25 years",
          intelligence_level: "animal",
          social_structure: "Massive herds of hundreds to thousands",
          rarity: "common",
          domesticable: false,
          migration_pattern: "Annual north-south migration following the rains and fresh grass. Herds travel thousands of kilometers, crossing rivers and navigating predator territories.",
          habitat_niche: "Open grasslands and savannahs",
          communication: "Grunting, bellowing during mating season, and alarm snorts when predators are detected."
        }
      },
      {
        id: "colonial_insect",
        name: "Colonial Insect",
        description: "A eusocial insect species with complex hive structures and caste-based division of labor.",
        element_type: "insect",
        summary: "A hive-building insect species with rigid social castes",
        fields: {
          body_type: "Hexapod with segmented exoskeleton",
          diet: "omnivore",
          max_size: "1-5 cm per individual; colonies span meters",
          lifespan: "Workers: months. Queens: 10-30 years",
          intelligence_level: "instinctive",
          social_structure: "Eusocial \u2014 queen, workers, soldiers, and drones",
          rarity: "common",
          domesticable: false,
          habitat_niche: "Underground or arboreal nests",
          communication: "Chemical pheromone trails, vibration patterns through the nest substrate, and antenna touching."
        }
      },
      {
        id: "deep_sea_leviathan",
        name: "Deep-Sea Leviathan",
        description: "A colossal marine creature dwelling in the lightless depths, the stuff of sailors' nightmares.",
        element_type: "fish",
        summary: "A titanic deep-ocean predator of legendary proportions",
        fields: {
          body_type: "Serpentine or cephalopod, massive",
          diet: "carnivore",
          max_size: "30-100+ meters",
          lifespan: "Unknown \u2014 possibly centuries",
          intelligence_level: "clever",
          social_structure: "Solitary",
          rarity: "very_rare",
          domesticable: false,
          habitat_niche: "Abyssal ocean depths, 1000m+",
          communication: "Deep infrasonic pulses that travel vast distances through the water. Bioluminescent displays."
        }
      },
      {
        id: "sky_whale",
        name: "Sky Whale",
        description: "A colossal lighter-than-air creature that filter-feeds on atmospheric plankton, drifting between continents.",
        element_type: "mythical_beast",
        summary: "A gentle giant that swims through the sky, its shadow darkening entire towns",
        fields: {
          body_type: "Cetacean-like with gas bladders and membranous fins for steering",
          diet: "filter_feeder",
          max_size: "80-200 meters in length",
          lifespan: "Unknown \u2014 oldest tracked individual exceeds 500 years",
          intelligence_level: "near_sentient",
          social_structure: "Small pods of 3-7 that sing to each other across hundreds of kilometers",
          rarity: "rare",
          domesticable: false,
          habitat_niche: "Upper atmosphere, 2000-8000m altitude",
          communication: "Infrasonic songs that resonate through the atmosphere for hundreds of kilometers. The songs shift seasonally and may encode navigational information. Scholars debate whether the songs constitute language.",
          migration_pattern: "Annual circumnavigation following atmospheric plankton blooms. Calving grounds are above remote mountain ranges where updrafts support newborns learning to stay aloft."
        }
      },
      {
        id: "mimic_predator",
        name: "Terrain Mimic",
        description: "A creature that perfectly disguises itself as a patch of terrain \u2014 a boulder, a fallen log, even a stretch of path.",
        element_type: "invertebrate",
        summary: "A patient ambush predator indistinguishable from its surroundings",
        fields: {
          body_type: "Amorphous, flattened \u2014 reshapes its outer tissue to match local terrain",
          diet: "carnivore",
          max_size: "2-8 meters across when flattened",
          lifespan: "30-60 years",
          intelligence_level: "clever",
          social_structure: "Solitary and fiercely territorial \u2014 two mimics near each other results in a slow, silent war of camouflage and ambush",
          rarity: "uncommon",
          domesticable: false,
          habitat_niche: "Anywhere with foot traffic \u2014 forest paths, river crossings, cave entrances",
          communication: "Chemical signals left in mucus trails. Other mimics can read these to determine territory boundaries, mating readiness, and prey density."
        }
      },
      {
        id: "symbiotic_pair",
        name: "Symbiotic Pair",
        description: "Two species so interdependent they function as one organism \u2014 one provides mobility, the other provides senses or defense.",
        element_type: "invertebrate",
        summary: "A dual-species organism where neither half can survive without the other",
        detailed_notes: "The Symbiotic Pair is not one creature but two \u2014 so deeply co-evolved that they are never found apart. The Carrier is a large, muscular invertebrate with powerful limbs but vestigial sensory organs. The Rider is a smaller, sessile organism with extraordinary sensory and defensive capabilities but no means of locomotion. The Rider fuses to the Carrier's dorsal surface early in life, their nervous systems intertwining until they share a unified perception of the world. The Carrier moves; the Rider sees, hears, and fights. Naturalists debate whether to classify them as one species or two \u2014 and the question has philosophical implications for how we define individuality.",
        fields: {
          body_type: "Composite \u2014 a large muscular base creature (the Carrier) with a sensory/defensive organism (the Rider) fused to its back",
          diet: "omnivore",
          max_size: "Combined: 1-2 meters. Carrier: 0.8-1.5m. Rider: 0.3-0.5m",
          lifespan: "40-70 years (both components age and die together)",
          intelligence_level: "clever",
          social_structure: "Mated pairs of Pairs \u2014 four organisms functioning as two, who cooperate in hunting and nesting",
          rarity: "rare",
          domesticable: false,
          habitat_niche: "Dense undergrowth and forest floors where the Rider's sensory advantage compensates for poor visibility",
          communication: "The Rider produces ultrasonic clicks for echolocation and communication with other Pairs. The Carrier communicates through ground vibrations."
        }
      },
      {
        id: "domesticated_predator",
        name: "Domesticated Predator",
        description: "A dangerous carnivore bred over generations into a loyal but volatile companion. Still deadly, but bonded.",
        element_type: "mammal",
        summary: "A tamed apex carnivore that serves as a fearsome but unpredictable companion",
        detailed_notes: "Domesticated Predators are the result of centuries of selective breeding from a wild apex carnivore. They retain their lethal natural weapons \u2014 fangs, claws, speed, and predatory instinct \u2014 but have been bred for a capacity to bond with a single handler. The bond is genuine but not absolute; these creatures are not pets. They require constant reinforcement, expert handling, and sufficient hunting to satisfy their predatory drive. Handlers bear scars as a matter of course. Cultures that breed Domesticated Predators view the handler-beast relationship as a sacred compact: the handler provides purpose and companionship, the beast provides protection and status. A handler whose predator turns on them is considered to have broken the compact through negligence or cruelty.",
        fields: {
          body_type: "Large quadruped, lean and muscular with retractable claws and powerful jaws",
          diet: "carnivore",
          max_size: "1.5-2.5 meters at the shoulder, 150-300 kg",
          lifespan: "15-25 years",
          intelligence_level: "clever",
          social_structure: "Bonds with a single handler; tolerates the handler's family. Aggressive toward strangers.",
          rarity: "rare",
          domesticable: true,
          habitat_niche: "Kept in handler compounds, kennels, or military camps. Wild ancestors inhabited dense forests and rocky highlands.",
          communication: "Low rumbling purrs when content, snarling and hissing in warning. Handlers learn to read ear position, tail carriage, and muscle tension for mood."
        }
      },
      {
        id: "living_fossil",
        name: "Living Fossil",
        description: "A creature unchanged for millions of years \u2014 a relic of a prior geological age, now rare and revered.",
        element_type: "reptile",
        summary: "An ancient species that has survived unchanged since a forgotten age of the world",
        detailed_notes: "The Living Fossil is a survivor \u2014 a species so perfectly adapted to a stable niche that evolution found no reason to change it. Its body plan, behavior, and physiology are identical to fossils dating back millions of years, predating the rise of every current sentient species. Encountering one is like looking through a window into deep time. They are slow, patient, and profoundly resilient, having survived every extinction event that reshaped the world around them. Many cultures revere them as sacred, believing they carry ancestral memory or that harming one invites geological-scale misfortune. Naturalists prize them as living laboratories for understanding ancient ecosystems.",
        fields: {
          body_type: "Heavily armored quadruped with a thick carapace, short limbs, and a beaked jaw",
          diet: "herbivore",
          max_size: "1-3 meters in length, 50-200 kg",
          lifespan: "200-500 years",
          intelligence_level: "animal",
          social_structure: "Solitary except during brief annual mating gatherings at ancestral sites",
          rarity: "very_rare",
          domesticable: false,
          habitat_niche: "Isolated valleys, deep caves, and remote islands \u2014 refugia that have remained ecologically stable for geological ages",
          communication: "Deep, resonant bellowing during mating season that can carry for kilometers. Otherwise silent and cryptic.",
          migration_pattern: "No migration \u2014 extreme site fidelity. Individuals may occupy the same territory for their entire centuries-long lives."
        }
      },
      {
        id: "echo_bat",
        name: "Echo Bat",
        description: "Navigates by psychic echolocation, sensing minds instead of surfaces.",
        element_type: "mammal",
        summary: "A bat that navigates by sensing conscious minds rather than physical surfaces \u2014 a living thought-detector",
        detailed_notes: 'The Echo Bat has abandoned conventional echolocation entirely. Instead of emitting sound and listening for reflections, it emits a low-frequency psychic pulse and detects the "echo" from conscious minds in its vicinity. The bat perceives the world as a map of thoughts: bright, active minds appear as vivid landmarks, sleeping minds as dim waypoints, and the mindless \u2014 rocks, trees, empty air \u2014 as void. This adaptation makes the Echo Bat a superlative predator of intelligent or semi-intelligent prey, as it can locate hiding creatures by their thoughts alone. It also makes them deeply unsettling to sentient beings: the sensation of being "pinged" by an Echo Bat is described as a brief, invasive tickle at the edge of awareness, like someone glancing at your thoughts. In dense populations of sentient creatures, Echo Bats become disoriented by the cacophony of minds and avoid cities. They are prized by intelligence services, as a trained Echo Bat can detect hidden persons through walls, underground, or in magical concealment that blocks conventional senses.',
        fields: {
          body_type: "Small winged mammal with oversized cranium and vestigial ears",
          diet: "carnivore",
          max_size: "15-25 cm wingspan, 20-40 grams",
          intelligence_level: "clever",
          social_structure: "Small colonies of 10-30 roosting together, hunting individually",
          rarity: "uncommon"
        }
      },
      {
        id: "glass_snake",
        name: "Glass Snake",
        description: "A transparent reptile, beautiful and venomous, nearly invisible.",
        element_type: "reptile",
        summary: "A completely transparent serpent \u2014 lethally venomous and nearly impossible to see",
        detailed_notes: "The Glass Snake is a marvel of evolutionary camouflage. Its body is almost entirely transparent: skin, muscle, and bone are composed of proteins with a refractive index matching the surrounding air, rendering the creature effectively invisible to the naked eye. Only its eyes \u2014 tiny, dark pinpoints \u2014 and the faint shadow it casts in direct sunlight betray its presence. The transparency serves both defensive and offensive purposes: predators cannot see it, and prey does not flee until the strike has already landed. The Glass Snake's venom is a potent neurotoxin that causes progressive paralysis within minutes. Treatment exists but requires knowing you've been bitten, which is problematic when the snake is invisible. Collectors prize Glass Snakes for their beauty \u2014 when placed against a dark background, their crystalline bodies refract light into prismatic patterns. This demand, combined with habitat loss, has made them increasingly rare. Handling them is extraordinarily dangerous, as keepers frequently lose track of their specimens.",
        fields: {
          body_type: "Serpentine, slender, with fully transparent tissues",
          diet: "carnivore",
          max_size: "0.5-1.5 meters in length",
          lifespan: "15-30 years",
          intelligence_level: "animal",
          social_structure: "Solitary and territorial \u2014 encounters between Glass Snakes are violent",
          rarity: "rare",
          domesticable: false,
          habitat_niche: "Forest floors, rocky outcrops, and tall grass where transparency provides maximum concealment",
          communication: "Vibrations transmitted through the ground. Mating pairs locate each other by rhythmic tail-tapping on stone surfaces."
        }
      },
      {
        id: "grief_moth",
        name: "Grief Moth",
        description: "An insect attracted to emotional pain. Swarms appear at funerals and battlefields.",
        element_type: "insect",
        summary: "A dark-winged moth drawn to sorrow and suffering, swarming wherever grief concentrates",
        detailed_notes: "The Grief Moth is a large, dark-winged insect that is attracted not to light, as most moths are, but to emotional suffering. The mechanism is poorly understood \u2014 the leading theory proposes that grief, stress, and trauma cause sentient beings to emit specific pheromones or bio-electric signatures that the moth's antennae are exquisitely tuned to detect. Whatever the mechanism, the correlation is undeniable: Grief Moths appear in swarms at funerals, battlefields, hospitals, sites of disaster, and anywhere that sapient beings gather in pain. The moths are not harmful \u2014 they do not bite, sting, or carry disease. They simply gather, settling on surfaces near the grieving and slowly opening and closing their dark wings. Many cultures interpret their presence as spiritual: the moths are said to carry sorrow away, or to be the souls of the dead visiting their mourners, or to feed on sadness itself. Others find their presence deeply unsettling \u2014 a visible, fluttering manifestation of collective pain. A swarm of Grief Moths at an unexpected location is considered a dire omen, suggesting hidden suffering or impending tragedy.",
        fields: {
          body_type: "Winged insect with broad, dark velvet wings and feathered antennae",
          diet: "herbivore",
          max_size: "8-15 cm wingspan",
          lifespan: "2-4 weeks as adults; larvae feed on decaying plant matter for months",
          intelligence_level: "instinctive",
          social_structure: "Swarm behavior triggered by grief-pheromone detection. No permanent social structure \u2014 swarms form and dissolve with the emotional state of nearby sapient beings.",
          rarity: "common",
          domesticable: false,
          habitat_niche: "Ubiquitous near sapient settlements. Larvae develop in damp soil and leaf litter. Adults are nomadic, drawn wherever sorrow concentrates.",
          communication: "Wing-beat frequency patterns within swarms. Pheromone trails to direct other moths toward grief sources."
        }
      }
    ],
    defaultSortField: "diet"
  };

  // src/domains/ecosystems.ts
  var ecosystemsConfig = {
    id: "ecosystems",
    name: "Ecosystem",
    namePlural: "Ecosystems",
    icon: "network",
    color: "#1abc9c",
    description: "Model the interconnected webs of life that tie flora, fauna, and environment together. Ecosystems capture food webs, energy flows, and the delicate balances that sustain\u2014or threaten\u2014your world's biodiversity.",
    tableName: "ecosystems",
    category: "natural",
    fields: [
      {
        name: "ecosystem_type",
        label: "Ecosystem Type",
        type: "text",
        required: true,
        placeholder: "e.g. coral reef, old-growth forest, deep cave network",
        helpText: "A descriptive name for this type of ecosystem."
      },
      {
        name: "energy_source",
        label: "Primary Energy Source",
        type: "text",
        placeholder: "e.g. solar, geothermal, chemosynthetic, magical",
        helpText: "The fundamental energy source driving this ecosystem."
      },
      {
        name: "stability",
        label: "Stability",
        type: "select",
        required: true,
        options: ["stable", "fragile", "resilient", "collapsing", "recovering"],
        helpText: "The current health and resilience of this ecosystem."
      },
      {
        name: "biodiversity_index",
        label: "Biodiversity Index",
        type: "text",
        placeholder: "e.g. very high, moderate, low",
        helpText: "A qualitative or quantitative measure of species diversity."
      },
      {
        name: "keystone_species_id",
        label: "Keystone Species",
        type: "text",
        placeholder: "ID of the keystone species",
        helpText: "The species whose removal would cause the ecosystem to collapse or fundamentally change."
      },
      {
        name: "biome_ids",
        label: "Biomes",
        type: "json",
        placeholder: '["forest_biome_1", "wetland_biome_2"]',
        helpText: "The biomes this ecosystem spans or exists within."
      },
      {
        name: "geographic_scope",
        label: "Geographic Scope",
        type: "text",
        placeholder: "e.g. 500 km\xB2, a single valley, continent-wide",
        helpText: "The approximate area or extent of this ecosystem."
      },
      {
        name: "succession_stage",
        label: "Succession Stage",
        type: "select",
        options: ["pioneer", "early", "developing", "mature", "climax", "degraded"],
        helpText: "The ecological succession stage \u2014 how mature and established this ecosystem is."
      },
      {
        name: "age",
        label: "Age",
        type: "text",
        placeholder: "e.g. 10,000 years, recently formed, ancient",
        helpText: "How long this ecosystem has existed in its current form."
      },
      {
        name: "threats",
        label: "Threats",
        type: "json",
        placeholder: '["deforestation", "invasive species", "mana depletion"]',
        helpText: "Current threats to this ecosystem's health and stability."
      }
    ],
    elementTypes: ["terrestrial", "aquatic", "aerial", "subterranean", "magical", "artificial"],
    elementTypeDescriptions: {
      terrestrial: "A land-based ecosystem \u2014 forests, grasslands, deserts, and the interconnected webs of life that sustain them.",
      aquatic: "A water-based ecosystem \u2014 oceans, rivers, lakes, and wetlands, from sunlit shallows to the deep abyss.",
      aerial: "An ecosystem that exists primarily in the air \u2014 sky islands, floating spore clouds, or communities of flying organisms.",
      subterranean: "An underground ecosystem sustained without sunlight \u2014 cave networks, fungal forests, or deep thermal vent communities.",
      magical: "An ecosystem powered or fundamentally shaped by magic \u2014 mana flows replace sunlight, and creatures feed on arcane energy.",
      artificial: "An ecosystem deliberately created or maintained by sentient beings \u2014 terraformed zones, enchanted gardens, or sealed habitats."
    },
    prompts: [
      "What are the keystone species in your major ecosystems? What would happen if they disappeared?",
      "How do food webs work in your world? Are there unusual trophic levels or energy sources beyond sunlight?",
      "Are any ecosystems currently under threat from civilization, climate change, or magical disruption?",
      "Have any ecosystems been artificially created\u2014magical gardens, terraformed wastelands, or engineered habitats?",
      "How do ecosystems recover after catastrophic events like volcanic eruptions, wars, or magical disasters?"
    ],
    magicPermeation: {
      companionTable: "ecosystems_magic_aspects",
      fields: [
        {
          name: "mana_cycle_id",
          label: "Mana Cycle",
          type: "text",
          placeholder: "ID of the associated mana cycle",
          helpText: "The mana cycle that governs magical energy flow through this ecosystem."
        },
        {
          name: "magical_food_web_id",
          label: "Magical Food Web",
          type: "text",
          placeholder: "ID of the magical food web",
          helpText: "The magical trophic network\u2014which organisms produce, transfer, and consume mana."
        },
        {
          name: "ambient_mana_level",
          label: "Ambient Mana Level",
          type: "textarea",
          helpText: "The baseline level of free magical energy in this ecosystem."
        },
        {
          name: "mana_flow_patterns",
          label: "Mana Flow Patterns",
          type: "textarea",
          helpText: "How mana moves through the ecosystem\u2014ley currents, seasonal tides, organism-driven cycles."
        },
        {
          name: "keystone_magical_species",
          label: "Keystone Magical Species",
          type: "textarea",
          helpText: "Species whose magical function is critical to the ecosystem's mana balance."
        },
        {
          name: "magical_carrying_capacity",
          label: "Magical Carrying Capacity",
          type: "textarea",
          helpText: "The maximum amount of magical activity this ecosystem can sustain before degradation."
        },
        {
          name: "magical_disturbance_history",
          label: "Magical Disturbance History",
          type: "textarea",
          helpText: "Past magical events that damaged or transformed this ecosystem."
        },
        {
          name: "recovery_from_magical_damage",
          label: "Recovery from Magical Damage",
          type: "textarea",
          helpText: "How this ecosystem heals after magical disruption\u2014natural recovery, remediation, or permanent scarring."
        },
        {
          name: "magical_succession",
          label: "Magical Succession",
          type: "textarea",
          helpText: "How the magical character of the ecosystem changes over time as it matures\u2014pioneer mana-species giving way to climax communities."
        },
        {
          name: "magic_relevance",
          label: "Magic Relevance",
          type: "select",
          options: ["none", "minor", "moderate", "major", "fundamental"],
          helpText: "How central magic is to this ecosystem's functioning."
        },
        {
          name: "custom_magic_notes",
          label: "Custom Magic Notes",
          type: "textarea",
          placeholder: "Any additional notes about magical aspects...",
          helpText: "Free-form notes on magical properties not covered above."
        }
      ],
      manaSensitivity: "active",
      planeAware: false,
      prompts: [
        'Is there a "mana cycle" analogous to the water or carbon cycle? How does magical energy flow through producers, consumers, and decomposers?',
        "What happens when an ecosystem's magical carrying capacity is exceeded\u2014mana storms, mutations, dead zones?",
        "Are there keystone magical species whose mana production or regulation keeps the entire ecosystem in balance?"
      ]
    },
    archetypes: [
      {
        id: "old_growth_forest",
        name: "Old-Growth Forest Ecosystem",
        description: "A mature, undisturbed forest ecosystem with centuries of accumulated complexity.",
        element_type: "terrestrial",
        summary: "An ancient forest ecosystem at climax succession",
        fields: {
          ecosystem_type: "Temperate old-growth forest",
          energy_source: "Solar radiation via photosynthesis",
          stability: "resilient",
          biodiversity_index: "High \u2014 hundreds of species in complex food webs",
          geographic_scope: "Regional (thousands of square kilometers)",
          succession_stage: "climax",
          age: "Several thousand years undisturbed"
        }
      },
      {
        id: "coral_reef_ecosystem",
        name: "Coral Reef Ecosystem",
        description: "A fragile marine ecosystem of extraordinary diversity built on a living coral framework.",
        element_type: "aquatic",
        summary: "A fragile but spectacularly biodiverse underwater world",
        fields: {
          ecosystem_type: "Tropical coral reef",
          energy_source: "Photosynthetic algae (zooxanthellae) in symbiosis with coral",
          stability: "fragile",
          biodiversity_index: "Extremely high \u2014 thousands of interdependent species",
          geographic_scope: "Local to regional (reef system)",
          succession_stage: "mature",
          age: "Thousands of years of continuous coral growth"
        }
      },
      {
        id: "hydrothermal_vent",
        name: "Hydrothermal Vent Ecosystem",
        description: "A deep-sea ecosystem sustained entirely by chemosynthesis around volcanic vents.",
        element_type: "aquatic",
        summary: "A bizarre ecosystem thriving in superheated darkness on the ocean floor",
        fields: {
          ecosystem_type: "Deep-sea hydrothermal vent",
          energy_source: "Chemosynthesis from volcanic mineral-rich superheated water",
          stability: "fragile",
          biodiversity_index: "Low species count but high endemism \u2014 most species found nowhere else",
          geographic_scope: "Extremely localized (single vent field)",
          succession_stage: "developing",
          age: "Decades to centuries (vents are geologically ephemeral)"
        }
      },
      {
        id: "freshwater_wetland",
        name: "Freshwater Wetland Ecosystem",
        description: "A seasonally flooded ecosystem that filters water and supports incredible bird and fish diversity.",
        element_type: "terrestrial",
        summary: "A waterlogged paradise for birds, fish, and amphibians",
        fields: {
          ecosystem_type: "Freshwater marsh and riparian wetland",
          energy_source: "Solar radiation and nutrient-rich flooding",
          stability: "resilient",
          biodiversity_index: "High \u2014 especially for birds, amphibians, and aquatic insects",
          geographic_scope: "Local (river floodplain or lake margin)",
          succession_stage: "mature",
          age: "Hundreds to thousands of years"
        }
      },
      {
        id: "symbiotic_megaorganism",
        name: "Symbiotic Megaorganism",
        description: "An ecosystem so tightly integrated that it functions as a single living superorganism \u2014 every species is an organ.",
        element_type: "magical",
        summary: "An ecosystem that IS a creature \u2014 every species within it functions like an organ",
        fields: {
          ecosystem_type: "Symbiotic megaorganism (borderline single entity)",
          energy_source: "Shared circulatory system distributing nutrients from photosynthetic and chemosynthetic members",
          stability: "fragile",
          biodiversity_index: "Moderate species count but total interdependence \u2014 remove one species and the whole system fails",
          geographic_scope: "Local (a single valley, island, or cavern)",
          succession_stage: "climax",
          age: "Ancient \u2014 the integration deepened over millions of years of co-evolution"
        }
      },
      {
        id: "war_scarred",
        name: "War-Scarred Ecosystem",
        description: "An ecosystem recovering from a magical or military catastrophe. Craters, dead zones, and pioneer species reclaiming ruined land.",
        element_type: "terrestrial",
        summary: "A devastated landscape slowly being reclaimed by life after catastrophic destruction",
        detailed_notes: "War-Scarred Ecosystems are the ecological aftermath of devastating conflict \u2014 whether conventional warfare, magical cataclysm, or both. The landscape bears visible wounds: blast craters filled with stagnant water, scorched earth where nothing grows, twisted remnants of fortifications, and soil contaminated with alchemical residue or lingering enchantments. Yet life is resilient. Pioneer species \u2014 hardy weeds, scavenging insects, and opportunistic fungi \u2014 are the first to return, breaking down debris and building new soil. Over decades, more complex species follow. These ecosystems are ecologically fascinating but emotionally haunting, serving as living memorials to the cost of war. Some cultures deliberately preserve them as warnings; others race to rehabilitate them.",
        fields: {
          ecosystem_type: "Post-catastrophe recovery zone",
          energy_source: "Solar radiation, supplemented by residual magical energy from wartime enchantments",
          stability: "recovering",
          biodiversity_index: "Low but rapidly increasing \u2014 pioneer species dominate, with complexity growing each decade",
          geographic_scope: "Regional (former battlefields, siege zones, or areas of magical bombardment)",
          succession_stage: "pioneer",
          age: "Decades to centuries since the catastrophe",
          threats: ["residual magical contamination", "unexploded enchantments", "soil toxicity", "invasive pioneer species crowding out native returnees"]
        }
      },
      {
        id: "parasitic_network",
        name: "Parasitic Network",
        description: "An ecosystem dominated by parasitic relationships rather than predation. Every species feeds off another.",
        element_type: "magical",
        summary: "A nightmarish web of life where every organism is both parasite and host",
        detailed_notes: "In a Parasitic Network, the dominant ecological relationship is not predation or competition but parasitism. Every species in the system feeds off at least one other, and is in turn fed upon by something else. The result is a complex, interlocking chain of exploitation that is paradoxically stable \u2014 no single parasite can afford to kill its host, because the host's parasites depend on it too. The ecosystem achieves a grim equilibrium where every organism is simultaneously suffering and sustaining. These systems often arise in mana-rich environments where magical energy subsidizes the metabolic cost of supporting parasites. They are deeply unsettling to visit \u2014 the forest seems alive in the wrong way, with organisms visibly attached to, growing from, or burrowing into one another.",
        fields: {
          ecosystem_type: "Parasitism-dominated trophic network",
          energy_source: "Ambient magical energy subsidizing the metabolic cost of universal parasitism",
          stability: "stable",
          biodiversity_index: "High \u2014 parasitic specialization drives extreme speciation",
          geographic_scope: "Local to regional (mana-saturated zones, cursed forests, corrupted wetlands)",
          succession_stage: "climax",
          age: "Centuries to millennia \u2014 parasitic equilibrium takes many generations to stabilize",
          threats: ["mana depletion destabilizing the energy subsidy", "introduction of non-parasitic competitors", "magical cleansing attempts that disrupt the balance"]
        }
      },
      {
        id: "seasonal_migration",
        name: "Great Migration Ecosystem",
        description: "An ecosystem defined by massive annual animal movements across hundreds of miles.",
        element_type: "terrestrial",
        summary: "A continent-spanning ecosystem that exists only because of annual mass animal migration",
        detailed_notes: "The Great Migration Ecosystem is not defined by a place but by a movement. Millions of animals travel hundreds or thousands of miles annually, following rains, green growth, or breeding instincts. The ecosystem encompasses the entire migration corridor \u2014 the calving grounds, the grazing plains, the river crossings, the predator gauntlets, and the dry-season refugia. Every organism along the route has adapted to the annual pulse of abundance and scarcity: grasses evolved to regrow from heavy grazing, predators time their breeding to the arrival of herds, scavengers follow the column of inevitable death, and dung beetles process the mountains of waste into fertile soil. Disrupting any segment of the corridor \u2014 a new fence, a drained river, a city built across the path \u2014 threatens the entire system.",
        fields: {
          ecosystem_type: "Migration-corridor ecosystem spanning multiple biomes",
          energy_source: "Solar radiation driving the grassland productivity that fuels the migration",
          stability: "resilient",
          biodiversity_index: "Very high \u2014 the migration supports distinct communities at every point along the route",
          geographic_scope: "Continental (migration corridors spanning hundreds to thousands of kilometers)",
          succession_stage: "mature",
          age: "Tens of thousands of years \u2014 the migration routes predate most civilizations",
          threats: ["corridor fragmentation by settlements or fences", "overhunting of migratory herds", "climate shifts altering rainfall patterns", "river damming blocking crossing points"]
        }
      },
      {
        id: "graveyard_ecosystem",
        name: "Graveyard Ecosystem",
        description: "Thrives on death: scavengers, fungi, bacteria forming rich necro-ecology.",
        element_type: "terrestrial",
        summary: "An ecosystem that feeds on death itself \u2014 a thriving necro-ecology of scavengers, decomposers, and recyclers",
        detailed_notes: "The Graveyard Ecosystem is a macabre but ecologically fascinating system that has developed in areas of sustained, concentrated mortality \u2014 ancient battlefields, mass burial sites, creature migration die-off zones, or natural traps where animals have been falling and dying for millennia. Unlike typical ecosystems that begin with photosynthesis, the Graveyard Ecosystem's primary energy input is death. The base of the food web is composed of specialized decomposers: bacteria that break down bone and flesh, fungi that digest keratin and chiite, and insects that feed on every stage of decay. Above them, scavenging vertebrates patrol for fresh inputs, and predators hunt the scavengers. The soil is extraordinarily rich \u2014 centuries of decomposition have created a deep, black humus that supports explosive plant growth around the margins of the active death zone. The ecosystem is self-reinforcing: the rich vegetation at the margins attracts herbivores, whose eventual deaths add to the organic input. Some Graveyard Ecosystems have persisted for so long that they have developed unique species found nowhere else \u2014 organisms so specialized for death-processing that they cannot survive in living-dominated ecosystems.",
        fields: {
          ecosystem_type: "Death-sustained decomposer community",
          energy_source: "Organic matter from continuous mortality events \u2014 biological energy rather than solar",
          stability: "stable",
          biodiversity_index: "Moderate \u2014 highly specialized species with low redundancy",
          threats: ["depletion of mortality source", "soil contamination from alchemical or magical residue in remains", "cultural disruption from communities that consider the sites sacred"],
          succession_stage: "climax"
        }
      },
      {
        id: "symbiotic_city",
        name: "Symbiotic City Ecosystem",
        description: "Urban ecosystem where buildings, organisms, and magic form an interdependent web.",
        element_type: "artificial",
        summary: "A city that is itself an ecosystem \u2014 buildings, organisms, and infrastructure forming a living, interdependent web",
        detailed_notes: "The Symbiotic City Ecosystem represents the endpoint of urban ecology: a settlement where the boundary between built environment and living system has dissolved entirely. Buildings are grown from living materials \u2014 coral-like organisms that secrete structural compounds, trees trained and shaped into load-bearing frameworks, fungal networks that form self-repairing insulation. Waste is processed by engineered decomposer organisms that convert refuse into soil and building materials. Water is filtered through living root systems embedded in every wall. Air is cleaned by photosynthetic organisms growing on every surface. The city breathes, grows, heals, and adapts. Every resident is a participant in the ecosystem: their waste feeds the decomposers, their breath feeds the plants, their body heat warms the living walls in winter. In return, the city provides shelter, clean air, fresh water, and food from integrated urban agriculture. The system is resilient but interconnected \u2014 a blight affecting one organism can cascade through the entire urban web.",
        fields: {
          ecosystem_type: "Integrated urban-biological system",
          energy_source: "Solar radiation supplemented by metabolic heat from inhabitants and geothermal taps",
          stability: "resilient",
          biodiversity_index: "High \u2014 hundreds of engineered and adapted species working in concert",
          threats: ["novel pathogens affecting keystone building-organisms", "population decline reducing metabolic inputs", "magical disruption destabilizing bio-architectural bonds"],
          succession_stage: "mature"
        }
      },
      {
        id: "void_edge",
        name: "Void Edge Ecosystem",
        description: "Ecosystem at the boundary of magical dead zones.",
        element_type: "magical",
        summary: "A liminal ecosystem clinging to the edge of magical dead zones \u2014 where mana-dependent life meets mundane reality",
        detailed_notes: "Void Edge Ecosystems form at the boundaries between mana-saturated regions and magical dead zones \u2014 areas where ambient magical energy drops to zero. The boundary is often sharp, creating a dramatic ecological gradient over a few hundred meters. On the mana-rich side, magical organisms thrive: mana-photosynthetic plants, spell-casting predators, and creatures that feed directly on ambient energy. On the dead side, only mundane organisms survive, stripped of any magical enhancement. At the edge itself, a unique community has developed \u2014 organisms that have adapted to fluctuating mana levels, switching between magical and mundane metabolisms as the boundary shifts. These edge-specialists are among the most adaptable organisms in the world, and they provide crucial ecosystem services: they process mana runoff that would otherwise poison the dead zone, and they introduce organic nutrients into the mana side where magical energy alone might not sustain complex food webs. The Void Edge is ecologically fragile \u2014 if the dead zone expands, the edge community is pushed back, and the magical ecosystem behind it loses its buffer.",
        fields: {
          ecosystem_type: "Mana-gradient boundary community",
          energy_source: "Mixed \u2014 ambient mana on the magical side, solar radiation on the dead side, both at the boundary",
          stability: "fragile",
          biodiversity_index: "High at the boundary itself, declining sharply into the dead zone",
          threats: ["dead zone expansion consuming the edge habitat", "mana surges overwhelming edge-adapted organisms", "exploitation of edge-specialist organisms for their dual-metabolism properties"],
          succession_stage: "developing"
        }
      }
    ],
    defaultSortField: "ecosystem_type"
  };

  // src/domains/sentient-species.ts
  var sentientSpeciesConfig = {
    id: "sentient_species",
    name: "Sentient Species",
    namePlural: "Sentient Species",
    icon: "users",
    color: "#9b59b6",
    description: "Define the intelligent peoples of your world\u2014their biology, senses, lifespans, and cognitive traits. Sentient species are the actors who build civilizations, wage wars, create art, and wield magic.",
    tableName: "sentient_species",
    category: "sentient",
    fields: [
      {
        name: "biological_basis",
        label: "Biological Basis",
        type: "text",
        required: true,
        placeholder: "e.g. carbon-based mammalian, silicon-crystalline, energy being",
        helpText: "The fundamental biological or material basis of this species."
      },
      {
        name: "physical_description",
        label: "Physical Description",
        type: "textarea",
        placeholder: "Describe body shape, skin/scales/feathers, coloring, distinguishing features...",
        helpText: "The general physical appearance and distinguishing traits of this species."
      },
      {
        name: "avg_height",
        label: "Average Height",
        type: "text",
        placeholder: "e.g. 1.7m, varies widely, 30cm",
        helpText: "Typical adult height or size."
      },
      {
        name: "avg_lifespan",
        label: "Average Lifespan",
        type: "text",
        placeholder: "e.g. 80 years, 500 years, indefinite",
        helpText: "Typical natural lifespan without magical or technological extension."
      },
      {
        name: "senses",
        label: "Senses",
        type: "json",
        placeholder: '["sight", "hearing", "echolocation", "mana-sense"]',
        helpText: "The sensory capabilities of this species."
      },
      {
        name: "cognitive_traits",
        label: "Cognitive Traits",
        type: "json",
        placeholder: '["pattern recognition", "hive-thinking", "perfect memory"]',
        helpText: "Notable cognitive abilities or tendencies that distinguish this species."
      },
      {
        name: "diet",
        label: "Diet",
        type: "select",
        options: ["herbivore", "carnivore", "omnivore", "filter_feeder", "photosynthetic", "detritivore", "magical", "custom"],
        helpText: "Primary dietary needs of this species."
      },
      {
        name: "communication_method",
        label: "Communication Method",
        type: "text",
        placeholder: "e.g. spoken language, pheromones, telepathy, light patterns",
        helpText: "Primary means of communication."
      },
      {
        name: "population",
        label: "Population",
        type: "text",
        placeholder: "e.g. 2 million, declining, unknown",
        helpText: "Current estimated population across all territories."
      },
      {
        name: "homeland_id",
        label: "Homeland",
        type: "text",
        placeholder: "ID of the homeland region",
        helpText: "The geographic region where this species originated or is primarily found."
      },
      {
        name: "sex_and_gender",
        label: "Sex & Gender",
        type: "textarea",
        placeholder: "Describe biological sexes, gender systems, dimorphism...",
        helpText: "Biological sex characteristics, sexual dimorphism, and gender systems within this species."
      },
      {
        name: "aging_stages",
        label: "Aging Stages",
        type: "textarea",
        placeholder: "Describe life phases \u2014 infancy, youth, adulthood, elderhood...",
        helpText: "The major life phases and how capabilities, appearance, or status change with age."
      },
      {
        name: "reproduction",
        label: "Reproduction",
        type: "textarea",
        placeholder: "Describe reproductive biology, family structures, and growth to maturity...",
        helpText: "How this species reproduces and raises offspring."
      }
    ],
    elementTypes: ["humanoid", "elven", "dwarven", "aquatic", "avian", "insectoid", "plant_based", "energy_being", "shapeshifter", "custom"],
    elementTypeDescriptions: {
      humanoid: "A bipedal, broadly human-shaped species. Versatile and adaptive, often the most widespread sentient form.",
      elven: "A graceful, long-lived species typically attuned to nature or magic. Often possesses heightened senses and slower aging.",
      dwarven: "A stocky, resilient species adapted to underground or mountainous environments. Known for craftsmanship and endurance.",
      aquatic: "A species adapted to life in water \u2014 gills, fins, or amphibious biology. Builds civilizations beneath the waves.",
      avian: "A winged, flight-capable species. Perception, navigation, and culture are shaped by life in three dimensions.",
      insectoid: "A species with an exoskeleton, compound eyes, or hive-based social structures. May think collectively or individually.",
      plant_based: "A species rooted in botanical biology \u2014 photosynthetic, slow-moving, or seasonally dormant. Thinks on different timescales.",
      energy_being: "A species composed of energy rather than matter \u2014 light, electricity, mana, or pure thought given form.",
      shapeshifter: "A species capable of altering its physical form. Identity, trust, and culture take on unique dimensions.",
      custom: "A sentient species that doesn't fit standard categories \u2014 something unique to your world."
    },
    prompts: [
      "What biological adaptations distinguish each sentient species? How have their bodies shaped their cultures and worldviews?",
      "How do different species perceive the world? Does a species with echolocation or mana-sight build cities differently than one with human-like vision?",
      "What is the reproductive biology of each species, and how does it influence family structures, gender roles, and population growth?",
      "How do different species' lifespans affect their relationship to history, planning, and intergenerational knowledge?",
      "Where do the boundaries of sentience lie in your world? Are there disputed cases\u2014clever animals, emergent hive minds, or awakened constructs?"
    ],
    magicPermeation: {
      companionTable: "sentient_species_magic_aspects",
      fields: [
        {
          name: "innate_magical_ability",
          label: "Innate Magical Ability",
          type: "select",
          options: ["none", "latent", "common", "universal", "extraordinary", "unique"],
          helpText: "How prevalent magical ability is among individuals of this species."
        },
        {
          name: "mana_sensitivity",
          label: "Mana Sensitivity",
          type: "textarea",
          helpText: "How sensitive this species is to ambient mana\u2014can they feel ley lines, sense enchantments, etc."
        },
        {
          name: "magical_affinity",
          label: "Magical Affinity",
          type: "textarea",
          helpText: "Types or schools of magic this species has a natural talent for."
        },
        {
          name: "magical_limitations",
          label: "Magical Limitations",
          type: "textarea",
          helpText: "Types of magic this species struggles with or cannot perform at all."
        },
        {
          name: "magic_organ_biology",
          label: "Magic Organ Biology",
          type: "textarea",
          helpText: "Physical organs, glands, or structures that enable magical ability\u2014mana cores, arcane nodes, etc."
        },
        {
          name: "magical_maturation",
          label: "Magical Maturation",
          type: "textarea",
          helpText: "How magical ability develops through the life stages\u2014childhood awakening, adolescent surges, elder mastery."
        },
        {
          name: "magical_variation",
          label: "Magical Variation",
          type: "textarea",
          helpText: "How much magical ability varies between individuals\u2014is it uniform, or are prodigies and nulls common?"
        },
        {
          name: "magical_evolution_history",
          label: "Magical Evolution History",
          type: "textarea",
          helpText: "How this species' relationship with magic has evolved over generations."
        },
        {
          name: "magical_cultural_significance",
          label: "Magical Cultural Significance",
          type: "textarea",
          helpText: "How magical ability shapes social status, professions, and cultural identity."
        },
        {
          name: "cross_species_magical_interactions",
          label: "Cross-Species Magical Interactions",
          type: "textarea",
          helpText: "How this species' magic interacts with or is perceived by other sentient species."
        },
        {
          name: "vulnerability_to_magic",
          label: "Vulnerability to Magic",
          type: "textarea",
          helpText: "Specific magical vulnerabilities\u2014iron sensitivity, susceptibility to enchantment, etc."
        },
        {
          name: "magic_relevance",
          label: "Magic Relevance",
          type: "select",
          options: ["none", "minor", "moderate", "major", "fundamental"],
          helpText: "How central magic is to this species' identity and biology."
        },
        {
          name: "custom_magic_notes",
          label: "Custom Magic Notes",
          type: "textarea",
          placeholder: "Any additional notes about magical aspects...",
          helpText: "Free-form notes on magical properties not covered above."
        }
      ],
      manaSensitivity: "active",
      planeAware: true,
      prompts: [
        "Is magical ability innate to all members of this species, or does it manifest only in some? What determines who has the gift?",
        "Do different species have biological organs for channeling magic? How does this affect their magical traditions compared to species that learn magic purely through study?",
        "How does a species' relationship with magic shape their social hierarchies\u2014are mages an elite class, feared outcasts, or simply tradespeople?"
      ]
    },
    archetypes: [
      {
        id: "baseline_humanoid",
        name: "Baseline Humanoid",
        description: "A versatile, adaptable bipedal species \u2014 the generalists of the sentient world.",
        element_type: "humanoid",
        summary: "An adaptable humanoid species with short lives but boundless ambition",
        fields: {
          biological_basis: "Carbon-based mammalian primate",
          avg_height: "1.5-1.9 meters",
          avg_lifespan: "70-90 years",
          diet: "omnivore",
          communication_method: "Spoken language with complex grammar, supplemented by writing and gesture",
          physical_description: "Upright bipedal posture, dexterous hands with opposable thumbs. Varied skin tones, hair colors, and builds across populations.",
          sex_and_gender: "Sexually dimorphic with binary biological sex. Gender expression varies significantly across cultures.",
          aging_stages: "Infancy (0-2), childhood (2-12), adolescence (12-18), adulthood (18-60), elderhood (60+)."
        }
      },
      {
        id: "long_lived_elven",
        name: "Long-Lived Elven",
        description: "A graceful, long-lived species attuned to nature and slow to change.",
        element_type: "elven",
        summary: "An ancient, graceful people whose long lives grant deep wisdom and deep grief",
        fields: {
          biological_basis: "Carbon-based humanoid with elongated cellular renewal",
          avg_height: "1.7-2.1 meters",
          avg_lifespan: "600-1000 years",
          diet: "herbivore",
          communication_method: "Melodic spoken language with tonal nuances inaudible to shorter-lived species",
          physical_description: "Tall and slender with angular features and pointed ears. Graceful movement. Hair tends toward silver, gold, or dark hues.",
          sex_and_gender: "Low sexual dimorphism. Gender is considered fluid across their long lifespans.",
          aging_stages: "Youth (0-50), maturation (50-120), prime (120-700), twilight (700+). Change is glacially slow."
        }
      },
      {
        id: "hardy_mountain_folk",
        name: "Hardy Mountain Folk",
        description: "A stocky, resilient species adapted to underground or mountainous environments.",
        element_type: "dwarven",
        summary: "A sturdy people who carve civilizations from living stone",
        fields: {
          biological_basis: "Carbon-based humanoid with dense bone and muscle structure",
          avg_height: "1.2-1.5 meters",
          avg_lifespan: "200-350 years",
          diet: "omnivore",
          communication_method: "Deep, resonant spoken language with a rich tradition of chanted history",
          physical_description: "Broad and stocky with barrel chests and powerful limbs. Thick beards are common across all sexes. Excellent low-light vision.",
          sex_and_gender: "Sexual dimorphism is subtle \u2014 outsiders often cannot distinguish. Gender roles in traditional culture are tied to craft specialty rather than biology.",
          aging_stages: "Youth (0-30), apprentice (30-60), journeyman (60-100), master (100-250), elder (250+)."
        }
      },
      {
        id: "aquatic_people",
        name: "Aquatic People",
        description: "A sentient species adapted to life in the oceans, with both gills and the ability to survive briefly on land.",
        element_type: "aquatic",
        summary: "An amphibious people at home in the ocean depths",
        fields: {
          biological_basis: "Carbon-based amphibious humanoid",
          avg_height: "1.6-2.0 meters",
          avg_lifespan: "100-150 years",
          diet: "omnivore",
          communication_method: "Sonar-like vocalizations underwater; breathy whistled speech on land",
          physical_description: "Streamlined humanoid form with webbed digits, gill slits along the ribcage, and iridescent scales on extremities. Large, dark eyes for low-light vision.",
          sex_and_gender: "Sequential hermaphroditism \u2014 individuals may change sex once during their lifetime based on social needs.",
          aging_stages: "Larval (0-5, gills dominant), juvenile (5-20, amphibious transition), adult (20-120), deep elder (120+, returns permanently to the deep)."
        }
      },
      {
        id: "fungal_collective",
        name: "Fungal Collective",
        description: "Not one organism but millions \u2014 a networked mycelial intelligence that thinks in parallel across kilometers of underground growth.",
        element_type: "plant_based",
        summary: "A distributed fungal network that achieved sentience through sheer interconnection",
        fields: {
          biological_basis: "Networked mycelial organism \u2014 no central brain, intelligence emerges from signal propagation across the network",
          avg_height: "Surface fruiting bodies: 0.5-2m. Underground network: spans kilometers",
          avg_lifespan: "The network is effectively immortal. Individual fruiting bodies last weeks to months.",
          diet: "detritivore",
          communication_method: "Chemical signaling through the mycelial network (fast, precise) and spore release for long-distance communication (slow, broadcast). Can interface with other species' nervous systems through parasitic filaments \u2014 with consent, this allows direct thought-sharing.",
          physical_description: "Surface manifestations range from clusters of mushroom-like fruiting bodies to humanoid shapes woven from mycelial threads when the collective needs to interact with bipedal species. The true body is the vast underground network.",
          sex_and_gender: "The collective has no sex or gender. It reproduces by extending its network or releasing spores that establish new nodes. When two networks merge, they share all memories \u2014 a form of reproduction and communion simultaneously.",
          aging_stages: "Node (new growth, simple reactions), Web (interconnected, basic reasoning), Grove (mature intelligence), Ancient Network (vast, slow, wise \u2014 may span an entire forest)."
        }
      },
      {
        id: "living_statues",
        name: "Lithic People",
        description: "Crystalline beings who think on geological timescales \u2014 a conversation takes years, but their thoughts are unimaginably deep.",
        element_type: "custom",
        summary: "Stone beings whose thoughts span centuries \u2014 patient beyond all mortal comprehension",
        fields: {
          biological_basis: "Silicon-crystalline lattice that processes information through piezoelectric impulses \u2014 essentially thinking stone",
          avg_height: "2-4 meters (grow slowly throughout life)",
          avg_lifespan: "Tens of thousands of years minimum. Oldest known individuals predate recorded history.",
          diet: "magical",
          communication_method: 'Subsonic vibrations transmitted through the ground (range: several kilometers). A "sentence" takes hours. They also communicate by growing crystalline structures that encode meaning in their lattice pattern \u2014 a library readable only by touch.',
          physical_description: "Vaguely humanoid forms of living crystal and mineral. Each individual's composition reflects their personality \u2014 some are granite and basalt (practical, grounded), others are quartz and amethyst (contemplative, luminous). They grow slowly, accumulating mass over millennia.",
          sex_and_gender: "Reproduce by budding \u2014 a fragment breaks off and is 'seeded' with a copy of the parent's base knowledge. No sex or gender. Parentage is referred to as 'the source vein.'",
          aging_stages: "Shard (newly budded, reactive and fast-thinking by their standards), Pillar (centuries old, settled), Monolith (millennia old, vast and slow), Mountain (so old they become indistinguishable from terrain \u2014 some mountains may be sleeping elders)."
        }
      },
      {
        id: "hive_mind",
        name: "Hive Mind Collective",
        description: "A species of thousands of individual bodies sharing one consciousness. Each body is expendable; the mind is the organism.",
        element_type: "insectoid",
        summary: "A single vast intelligence distributed across thousands of expendable insectoid bodies",
        detailed_notes: "The Hive Mind Collective is not a society \u2014 it is a single being wearing thousands of bodies. Each individual unit is a small insectoid creature with limited autonomous capability, but when connected to the collective consciousness through pheromone fields and bioelectric signaling, they function as cells in a distributed brain. The Collective thinks, plans, and feels as one entity. It can sacrifice hundreds of bodies without distress \u2014 they are fingertips, not children. This makes the Collective extraordinarily difficult for other sentient species to relate to. Diplomats must speak to the swarm, not to any individual. The Collective experiences a form of loneliness that other species cannot comprehend: it is always and only talking to itself.",
        fields: {
          biological_basis: "Carbon-based insectoid individuals linked by bioelectric field and pheromone signaling into a unified consciousness",
          avg_height: "Individual units: 10-30 cm. Collective can occupy structures spanning hundreds of meters.",
          avg_lifespan: "Individual units: 2-5 years. The Collective consciousness: effectively immortal as long as a critical mass of units persists.",
          senses: ["compound vision", "pheromone detection", "bioelectric field sense", "vibration"],
          cognitive_traits: ["parallel processing", "distributed memory", "instantaneous consensus", "no concept of individual identity"],
          diet: "omnivore",
          communication_method: "Internal: bioelectric pulses and pheromone gradients. External: the Collective shapes groups of bodies into symbols, writes with trails of individuals, or designates a speaker-unit to vocalize (poorly) in other species' languages.",
          physical_description: "Individual units resemble large beetles with iridescent carapaces and multiple antennae. The Collective often arranges bodies into larger shapes \u2014 a humanoid figure for diplomacy, a wall for defense, a river of bodies for transport.",
          sex_and_gender: 'Reproduction is budding \u2014 the Collective grows new units from specialized breeder castes. No sex or gender concept. The Collective refers to itself as "we" when forced to use singular-species languages, but considers this a grammatical compromise.',
          aging_stages: "Swarmling (newly formed Collective, reactive and impulsive), Mature Hive (stable, strategic), Ancient Mind (vast, contemplative, may begin to fragment into sub-personalities if it grows too large)."
        }
      },
      {
        id: "constructed_people",
        name: "Constructed People",
        description: "Golems, automata, or magical constructs given true sentience. Created, not born \u2014 raising questions of rights and identity.",
        element_type: "custom",
        summary: "Artificially created beings who achieved or were granted genuine consciousness and selfhood",
        detailed_notes: 'Constructed People were made \u2014 carved from stone, assembled from metal, woven from enchanted thread, or sculpted from living clay \u2014 and then, through magic, accident, or emergent complexity, they became aware. They think, feel, and choose. This makes them profoundly unsettling to both their creators and to naturally-born species. Are they property or people? Do they have souls? Can they be unmade without it being murder? Different civilizations answer these questions differently, and the Constructed People themselves hold passionate and divided opinions. Some embrace their artificial nature as freedom from biological constraints. Others desperately seek to become "real" \u2014 to eat, to age, to reproduce, to die naturally. Their existence is a living philosophical argument.',
        fields: {
          biological_basis: "Varies \u2014 enchanted stone, animated metal, woven magical fiber, alchemical clay, or crystallized spell-energy",
          avg_height: "Varies by design \u2014 0.5 to 3 meters, though most are built to humanoid scale for ease of social integration",
          avg_lifespan: "Potentially indefinite with maintenance. Without it, decades to centuries depending on materials. Some choose to cease functioning.",
          senses: ["sight (often magical)", "hearing", "vibration sense", "mana-sense"],
          cognitive_traits: ["perfect recall", "logical reasoning", "difficulty with metaphor (initially)", "learned empathy"],
          diet: "magical",
          communication_method: "Spoken language learned from their creators. Some also communicate through inscribed runes that glow on their surfaces, or through direct magical resonance with other constructs.",
          physical_description: "Humanoid forms crafted from their base material \u2014 stone with glowing rune-joints, brass with ticking clockwork, clay with fingerprint impressions of their maker. Each is unique, bearing the artistic style of their creator.",
          sex_and_gender: "No biological sex. Gender, if adopted, is chosen. Some embrace gender as part of personhood; others find the concept irrelevant. Reproduction is impossible without a creator \u2014 a source of existential anguish for some.",
          aging_stages: "Awakening (newly sentient, confused and literal-minded), Individuation (developing personality and preferences), Maturity (full personhood with complex emotional life), Weathering (body degrading, facing mortality for the first time)."
        }
      },
      {
        id: "phase_beings",
        name: "Phase Beings",
        description: "Creatures that exist partially in another plane. They flicker between realities, making them uncanny and hard to interact with.",
        element_type: "energy_being",
        summary: "Entities that straddle two planes of existence, never fully present in either",
        detailed_notes: 'Phase Beings exist simultaneously in the material plane and an adjacent reality \u2014 they are always partly elsewhere. To material observers, they appear to flicker, shimmer, or partially transparent, as if seen through heat haze. Their voices echo strangely, arriving a half-second before their lips move. They can reach through solid objects by shifting their hand to the other plane, and they are notoriously difficult to restrain, imprison, or harm with physical weapons. However, their dual existence comes at a cost: they struggle to form deep connections with beings anchored in a single reality. They describe the experience as "never being fully anywhere" \u2014 present enough to feel loneliness but not enough to feel belonging. Other species find them unsettling, beautiful, or terrifying depending on cultural context.',
        fields: {
          biological_basis: "Transdimensional energy matrix anchored partially in the material plane and partially in an adjacent reality",
          avg_height: "1.5-2.0 meters (apparent \u2014 their true extent in the other plane is unknown)",
          avg_lifespan: "Uncertain \u2014 possibly centuries. They seem to fade gradually rather than die, becoming more present in the other plane until they vanish from this one entirely.",
          senses: ["material sight", "planar sight", "phase-sense (awareness of dimensional boundaries)", "hearing across planes"],
          cognitive_traits: ["dual-plane awareness", "nonlinear time perception", "difficulty with permanence and commitment", "profound spatial intelligence"],
          diet: "photosynthetic",
          communication_method: "Phase-speech \u2014 words that vibrate across both planes simultaneously, audible to material beings as an eerie harmonic layering. They can also communicate by modulating their visibility, flickering in patterns that encode meaning.",
          physical_description: "Tall, luminous humanoid forms that shimmer and flicker like a candle flame in wind. Their features shift subtly depending on which plane the observer focuses on. Translucent at the edges, more solid at the core. They cast shadows in two directions.",
          sex_and_gender: "Phase Beings reproduce by resonance \u2014 two individuals synchronize their phase frequencies until a new consciousness crystallizes between them. No biological sex. Identity is tied to phase-frequency rather than physical form.",
          aging_stages: "Spark (newly formed, tightly anchored to the material plane), Shimmer (maturing, beginning to sense the other plane), Full Phase (adulthood, equally present in both realities), Fade (gradually shifting to the other plane, becoming ghostlike in this one)."
        }
      },
      {
        id: "dreamwalkers",
        name: "Dreamwalkers",
        description: "A species that lives primarily in the dream plane. Physical bodies are secondary shells.",
        element_type: "energy_being",
        summary: "Ethereal beings whose true lives unfold in dreams, wearing physical bodies only when they must",
        detailed_notes: "Dreamwalkers spend most of their existence in the dream plane, where they build cities, wage wars, fall in love, and create art. Their physical bodies are pale, translucent husks that sit motionless in communal sleep-halls, sustained by ambient mana and tended by caretakers. When forced into the waking world \u2014 for trade, diplomacy, or emergencies \u2014 they move clumsily, speak haltingly, and seem perpetually distracted, as though listening to a conversation no one else can hear. Other species find them unsettling: their eyes never quite focus, their reactions are delayed, and they sometimes respond to questions that haven't been asked yet. In the dream plane, however, they are vibrant, quick, and terrifyingly powerful. Their dream-cities are architectural impossibilities of light and thought, and their culture is millennia older than anything in the waking world.",
        fields: {
          biological_basis: "Transdimensional consciousness anchored to a dormant physical shell \u2014 the body is a tether, not a home",
          avg_height: "1.6-1.8 meters (physical shell). Dream-form varies by will.",
          avg_lifespan: "Physical shell: 200-300 years. Dream-consciousness: potentially indefinite, though identity gradually diffuses over millennia.",
          senses: ["dream-sight", "emotional resonance", "mana-sense", "vestigial physical senses"],
          cognitive_traits: ["parallel dream-wake awareness", "nonlinear memory", "intuitive empathy", "difficulty with physical causality"],
          communication_method: "Dream-speech \u2014 direct transmission of meaning, emotion, and imagery between minds. In the waking world, they speak slowly and literally, struggling with the imprecision of verbal language.",
          physical_description: "Slender, pale humanoid forms with translucent skin through which faint luminous veins are visible. Eyes are solid white with no visible iris or pupil. Hair is fine and silver. They appear to be perpetually on the verge of sleep."
        }
      },
      {
        id: "echo_people",
        name: "Echo People",
        description: "Beings made of compressed sound. They speak themselves into existence and fade if silenced too long.",
        element_type: "custom",
        summary: "Living sound given form \u2014 they must keep speaking or cease to exist",
        detailed_notes: "Echo People are not born; they are spoken. A sustained harmonic resonance in a mana-rich environment can spontaneously coalesce into a sentient being made of compressed sound waves. They maintain their physical coherence through continuous vocalization \u2014 humming, singing, speaking, or even just breathing audibly. Prolonged silence causes them to literally fade, becoming transparent and eventually dissipating entirely. This existential dependency on sound shapes every aspect of their culture: silence is death, music is sacred, and the deaf are objects of horrified pity. Their bodies are semi-solid, appearing as humanoid shapes made of visible sound waves \u2014 shimmering, vibrating, and subtly distorting the air around them. They can modulate their frequency to pass through solid objects or become nearly invisible.",
        fields: {
          biological_basis: "Coherent standing wave of compressed sound energy, sustained by continuous vocalization and ambient mana",
          avg_height: "1.4-2.0 meters (varies with emotional state \u2014 excitement expands them, fear compresses)",
          avg_lifespan: "Indefinite as long as they keep vocalizing. Average practical lifespan: 150-400 years before vocal fatigue accumulates.",
          senses: ["vibration detection", "echolocation", "frequency analysis", "mana-resonance"],
          cognitive_traits: ["perfect pitch", "harmonic reasoning", "simultaneous multi-voice thinking", "terror of silence"],
          communication_method: "Polyphonic speech \u2014 they can produce multiple tones simultaneously, layering meaning in harmonics. Conversation between Echo People sounds like a symphony to outsiders.",
          physical_description: "Semi-transparent humanoid shapes composed of visible sound waves. Their bodies shimmer and ripple like heat haze. Features are suggested rather than defined \u2014 a face-like pattern of harmonics, limb-shapes of resonance. They glow faintly and the air around them vibrates."
        }
      },
      {
        id: "memory_eaters",
        name: "Memory Eaters",
        description: "A species that feeds on memories. Symbiotic or parasitic depending on consent.",
        element_type: "shapeshifter",
        summary: "Shape-shifting beings nourished by the memories of others \u2014 healers or predators depending on the bargain",
        detailed_notes: "Memory Eaters consume memories as sustenance, drawing them out through physical contact and absorbing them into their own consciousness. The process can be consensual and even therapeutic \u2014 many cultures employ Memory Eaters to remove traumatic memories, treat madness, or ease the burden of grief. In symbiotic relationships, they are trusted counselors who carry the pain others cannot bear. But the same ability makes them terrifying predators: a rogue Memory Eater can drain a person's identity in minutes, leaving an empty shell. Their shapeshifting ability compounds the threat \u2014 they instinctively take on the appearance of the last person whose memories they consumed, making them almost impossible to identify. The ethical divide within the species is profound: some clans maintain strict codes of consent, while others view non-Memory Eaters as livestock.",
        fields: {
          biological_basis: "Psycho-reactive protoplasm that reshapes itself based on consumed memories \u2014 the body is a reflection of what it has eaten",
          avg_height: "1.5-1.9 meters (in default form). Assumed form matches the memory source.",
          avg_lifespan: "300-500 years, though identity becomes increasingly fragmented as consumed memories accumulate.",
          senses: ["memory-sense (detecting strong memories in nearby minds)", "emotional aura reading", "standard humanoid senses in assumed forms"],
          cognitive_traits: ["perfect recall of consumed memories", "identity fluidity", "deep empathy (involuntary)", "risk of personality fragmentation"],
          communication_method: "Spoken language adapted from consumed memories \u2014 they learn languages instantly by eating a speaker's linguistic memories. Native communication is through memory-sharing via touch.",
          physical_description: "In their natural form, they are featureless humanoid shapes of pale, slightly luminous flesh \u2014 smooth, hairless, and without distinct facial features. When they consume memories, they gradually take on the appearance of the memory's source, becoming an increasingly perfect copy."
        }
      }
    ],
    defaultSortField: "biological_basis"
  };

  // src/domains/civilizations.ts
  var civilizationsConfig = {
    id: "civilizations",
    name: "Civilization",
    namePlural: "Civilizations",
    icon: "landmark",
    color: "#8e44ad",
    description: "Define the organized societies of your world\u2014their governments, economies, militaries, and territorial ambitions. Civilizations are the political and institutional frameworks within which cultures, technologies, and conflicts emerge.",
    tableName: "civilizations",
    category: "sentient",
    fields: [
      {
        name: "government_type",
        label: "Government Type",
        type: "select",
        required: true,
        options: ["monarchy", "republic", "democracy", "oligarchy", "theocracy", "magocracy", "military_junta", "tribal_council", "feudal", "imperial", "anarchist", "hive_mind", "custom"],
        helpText: "The primary form of governance in this civilization."
      },
      {
        name: "tech_level",
        label: "Technology Level",
        type: "select",
        required: true,
        options: ["stone_age", "bronze_age", "iron_age", "medieval", "renaissance", "industrial", "modern", "post_modern", "magitech", "custom"],
        helpText: "The general level of technological development."
      },
      {
        name: "magic_integration",
        label: "Magic Integration",
        type: "select",
        options: ["none", "forbidden", "rare_elite", "regulated", "widespread", "fundamental", "declining"],
        helpText: "How deeply magic is integrated into the functioning of this civilization."
      },
      {
        name: "population",
        label: "Population",
        type: "text",
        placeholder: "e.g. 5 million, several hundred thousand, unknown",
        helpText: "Current estimated total population."
      },
      {
        name: "territory_description",
        label: "Territory Description",
        type: "textarea",
        placeholder: "Describe the lands claimed or controlled by this civilization...",
        helpText: "Geographic extent, borders, and key territorial features."
      },
      {
        name: "founded_era_id",
        label: "Founded Era",
        type: "text",
        placeholder: "ID of the founding era or event",
        helpText: "The historical era or event in which this civilization was founded."
      },
      {
        name: "species_id",
        label: "Primary Species",
        type: "text",
        placeholder: "ID of the dominant or founding species",
        helpText: "The sentient species that founded or primarily comprises this civilization."
      },
      {
        name: "economic_system",
        label: "Economic System",
        type: "select",
        options: ["barter", "mercantile", "feudal", "capitalist", "socialist", "command", "gift_economy", "mana_based", "mixed", "custom"],
        helpText: "The dominant economic model."
      },
      {
        name: "military_strength",
        label: "Military Strength",
        type: "select",
        options: ["none", "militia_only", "moderate", "strong", "dominant", "legendary"],
        helpText: "Overall military power relative to neighboring civilizations."
      },
      {
        name: "capital_id",
        label: "Capital",
        type: "text",
        placeholder: "ID of the capital city or seat of power",
        helpText: "The geographic place serving as the capital or seat of government."
      },
      {
        name: "growth_status",
        label: "Growth Status",
        type: "select",
        options: ["nascent", "growing", "stable", "stagnant", "declining", "collapsed", "resurgent"],
        helpText: "Whether this civilization is expanding, stable, or in decline."
      },
      {
        name: "diplomatic_stance",
        label: "Diplomatic Stance",
        type: "select",
        options: ["expansionist", "aggressive", "defensive", "isolationist", "mercantile", "diplomatic", "tributary", "hegemonic"],
        helpText: "The general approach this civilization takes toward foreign relations."
      }
    ],
    elementTypes: ["empire", "kingdom", "republic", "tribal_confederation", "city_state", "nomadic", "theocracy", "magocracy", "custom"],
    elementTypeDescriptions: {
      empire: "A vast, multi-ethnic state ruled by a central authority \u2014 an emperor, council, or dynasty. Expands through conquest or diplomacy.",
      kingdom: "A state ruled by a hereditary monarch, with a nobility, feudal obligations, and defined territorial borders.",
      republic: "A state governed by elected representatives or appointed officials rather than a monarch. Power derives from civic participation.",
      tribal_confederation: "A loose alliance of clans or tribes united by kinship, treaty, or a shared threat. Flexible but potentially fragile.",
      city_state: "A single sovereign city and its surrounding territory. Self-governing, often wealthy, and fiercely independent.",
      nomadic: "A mobile civilization that follows herds, trade routes, or seasonal resources rather than settling permanently.",
      theocracy: "A state ruled by religious authority \u2014 priests, prophets, or divine mandate. Faith and law are one.",
      magocracy: "A state ruled by magic users \u2014 wizards, sorcerers, or those with innate magical talent hold political power.",
      custom: "A civilization type that doesn't fit standard categories \u2014 something unique to your world."
    },
    prompts: [
      "What tensions exist between the ruling class and the governed? Is power held by birthright, magical talent, wealth, or popular mandate?",
      "How does this civilization interact with its neighbors\u2014through diplomacy, trade, conquest, or isolation?",
      "What are the civilization's greatest achievements and deepest failures? What do they celebrate and what do they try to forget?",
      "How does the economic system distribute resources? Are there stark inequalities, and if so, what justifies them in the eyes of the powerful?",
      "What existential threats does this civilization face\u2014internal decay, external invasion, resource depletion, or magical catastrophe?"
    ],
    magicPermeation: {
      companionTable: "civilizations_magic_aspects",
      fields: [
        {
          name: "magic_governance",
          label: "Magic Governance",
          type: "textarea",
          helpText: "How the government regulates, controls, or promotes the use of magic\u2014licensing, academies, prohibitions."
        },
        {
          name: "magical_economy",
          label: "Magical Economy",
          type: "textarea",
          helpText: "The role of magic in commerce, industry, and wealth generation\u2014enchanted goods, mana trade, spell services."
        },
        {
          name: "spell_infrastructure",
          label: "Spell Infrastructure",
          type: "textarea",
          helpText: "Magical infrastructure supporting the civilization\u2014warded walls, teleportation networks, scrying systems, weather control."
        },
        {
          name: "magical_military",
          label: "Magical Military",
          type: "textarea",
          helpText: "Military applications of magic\u2014battle mages, enchanted weapons, magical siege engines, ward defenses."
        },
        {
          name: "magical_education",
          label: "Magical Education",
          type: "textarea",
          helpText: "How magic is taught\u2014academies, apprenticeships, temples, state programs, or suppressed entirely."
        },
        {
          name: "magic_social_hierarchy",
          label: "Magic & Social Hierarchy",
          type: "textarea",
          helpText: "How magical ability affects social standing\u2014are mages revered, feared, enslaved, or treated as ordinary citizens?"
        },
        {
          name: "magical_law_enforcement",
          label: "Magical Law Enforcement",
          type: "textarea",
          helpText: "How magic is used to enforce laws or how magical crimes are policed and punished."
        },
        {
          name: "magical_healthcare",
          label: "Magical Healthcare",
          type: "textarea",
          helpText: "The role of healing magic in public health\u2014who has access, how is it regulated, what are its limits?"
        },
        {
          name: "magic_tech_relationship",
          label: "Magic-Technology Relationship",
          type: "textarea",
          helpText: "How magic and mundane technology interact\u2014do they complement, compete, or merge into magitech?"
        },
        {
          name: "attitude_toward_magic",
          label: "Attitude Toward Magic",
          type: "select",
          options: ["reverent", "pragmatic", "fearful", "hostile", "indifferent", "divided", "dependent"],
          helpText: "The prevailing cultural attitude toward magic within this civilization."
        },
        {
          name: "magitech_era_id",
          label: "Magitech Era",
          type: "text",
          placeholder: "ID of the era when magitech emerged",
          helpText: "The historical period when this civilization began integrating magic and technology."
        },
        {
          name: "magic_relevance",
          label: "Magic Relevance",
          type: "select",
          options: ["none", "minor", "moderate", "major", "fundamental"],
          helpText: "How central magic is to the identity and functioning of this civilization."
        },
        {
          name: "custom_magic_notes",
          label: "Custom Magic Notes",
          type: "textarea",
          placeholder: "Any additional notes about magical aspects...",
          helpText: "Free-form notes on magical properties not covered above."
        }
      ],
      manaSensitivity: "active",
      planeAware: true,
      prompts: [
        "Does this civilization regulate magic like a weapon, a profession, or a natural right? What happens to those who practice forbidden magic?",
        "How has the availability (or scarcity) of magic shaped the civilization's architecture, warfare, and daily life?",
        "Is there a tension between magical elites and the non-magical majority? Has this ever sparked revolutions or reforms?"
      ]
    },
    archetypes: [
      {
        id: "feudal_kingdom",
        name: "Feudal Kingdom",
        description: "A medieval kingdom ruled by a hereditary monarch, with lords, vassals, and a peasant majority.",
        element_type: "kingdom",
        summary: "A hereditary kingdom held together by oaths of fealty and tradition",
        fields: {
          government_type: "feudal",
          tech_level: "medieval",
          magic_integration: "rare_elite",
          economic_system: "feudal",
          military_strength: "moderate",
          growth_status: "stable",
          diplomatic_stance: "defensive",
          territory_description: "A contiguous realm centered on a fertile river valley, with outlying provinces held by vassal lords. Borders defined by natural features \u2014 mountains, rivers, and dense forests."
        }
      },
      {
        id: "trading_republic",
        name: "Trading Republic",
        description: "A wealthy merchant republic where political power follows economic power.",
        element_type: "republic",
        summary: "A prosperous republic where merchant princes wield political power",
        fields: {
          government_type: "oligarchy",
          tech_level: "renaissance",
          magic_integration: "regulated",
          economic_system: "mercantile",
          military_strength: "moderate",
          growth_status: "growing",
          diplomatic_stance: "mercantile",
          territory_description: "A coastal city-state with a modest hinterland but extensive overseas trading posts, colonies, and treaty ports. Power projects outward via its merchant fleet."
        }
      },
      {
        id: "nomadic_confederation",
        name: "Nomadic Confederation",
        description: "A loose alliance of mobile clans united under a great leader, following herds and seasonal routes.",
        element_type: "nomadic",
        summary: "A powerful horse-borne confederation of steppe clans",
        fields: {
          government_type: "tribal_council",
          tech_level: "iron_age",
          magic_integration: "none",
          economic_system: "barter",
          military_strength: "strong",
          growth_status: "growing",
          diplomatic_stance: "expansionist",
          territory_description: "No fixed borders \u2014 the confederation claims vast open steppes and grasslands through which its clans roam. Seasonal camps at traditional gathering sites."
        }
      },
      {
        id: "theocratic_empire",
        name: "Theocratic Empire",
        description: "A vast empire ruled by a divine sovereign or priestly caste, where faith and law are one.",
        element_type: "empire",
        summary: "A divine empire where the priesthood rules in the name of the gods",
        fields: {
          government_type: "theocracy",
          tech_level: "iron_age",
          magic_integration: "fundamental",
          economic_system: "command",
          military_strength: "dominant",
          growth_status: "stable",
          diplomatic_stance: "hegemonic",
          territory_description: "A sprawling empire radiating from a sacred capital. Temple complexes serve as administrative centers in each province. Holy roads connect the faithful."
        }
      },
      {
        id: "isolated_city_state",
        name: "Isolated City-State",
        description: "A single fortified city governing itself independently, relying on strong walls and clever diplomacy.",
        element_type: "city_state",
        summary: "A self-governing city surviving by wit among greater powers",
        fields: {
          government_type: "republic",
          tech_level: "medieval",
          magic_integration: "regulated",
          economic_system: "mixed",
          military_strength: "militia_only",
          growth_status: "stable",
          diplomatic_stance: "isolationist",
          territory_description: "The city and its immediate farmlands within a day's ride. Surrounded by larger, more powerful neighbors, surviving through neutrality and strategic value."
        }
      },
      {
        id: "necrocracy",
        name: "Undead Bureaucracy",
        description: "A civilization where the dead continue to govern \u2014 ancestor spirits or preserved liches hold every office, and the living are merely the junior workforce.",
        element_type: "custom",
        summary: "A realm where death is a promotion \u2014 the undead govern, and the living serve their time",
        fields: {
          government_type: "oligarchy",
          tech_level: "magitech",
          magic_integration: "fundamental",
          economic_system: "command",
          military_strength: "dominant",
          growth_status: "stagnant",
          diplomatic_stance: "isolationist",
          territory_description: "A grey, orderly realm where cities are immaculately maintained by tireless undead labor. The living occupy the sunlit districts; the dead govern from the underground administrative complexes. Borders are warded against uninvited life and death alike."
        }
      },
      {
        id: "underground_empire",
        name: "Underground Empire",
        description: "A civilization built entirely beneath the surface. Deep cities, fungal agriculture, bioluminescent lighting, no sky.",
        element_type: "empire",
        summary: "A vast subterranean empire that has never seen the sun and does not miss it",
        detailed_notes: "The Underground Empire has existed beneath the surface for so long that its people consider the sky a myth \u2014 or worse, a dangerous void. Their cities are carved from living rock, illuminated by cultivated bioluminescent fungi and mineral phosphorescence. Agriculture is based on fungal farms, subterranean lakes stocked with blind fish, and insect husbandry. Water comes from underground rivers; heat from geothermal vents. The civilization is vertically stratified: the deepest levels, closest to geothermal heat, are the domain of the powerful. The upper tunnels, closer to the dangerous surface, are for the poor and the military. Expansion means digging \u2014 and the empire's engineers and miners are the most honored profession, equivalent to admirals in a surface navy.",
        fields: {
          government_type: "imperial",
          tech_level: "iron_age",
          magic_integration: "regulated",
          economic_system: "feudal",
          military_strength: "strong",
          population_size: "Several million spread across hundreds of interconnected cavern-cities",
          growth_status: "growing",
          diplomatic_stance: "isolationist",
          territory_description: "A vast network of interconnected caverns, tunnels, and excavated chambers spanning hundreds of kilometers beneath a mountain range. The deepest cities reach several kilometers below the surface. Surface access points are heavily fortified and rarely used."
        }
      },
      {
        id: "pirate_republic",
        name: "Pirate Republic",
        description: "A lawless maritime state governed by codes of conduct among equals. Freedom above all, but survival requires cooperation.",
        element_type: "republic",
        summary: "A chaotic maritime democracy where freedom is law and every captain has a vote",
        detailed_notes: "The Pirate Republic began as a haven for outcasts \u2014 mutineers, escaped slaves, exiled nobles, and wanted criminals who discovered that the only law they could agree on was the right to be free. Over generations, this anti-civilization developed its own complex governance: a council of captains where every ship commander has an equal vote, articles of conduct that protect crew rights, and a shared defense pact against naval powers that would destroy them. The Republic has no fixed capital \u2014 it moves with its fleet, though certain harbors and hidden coves serve as traditional gathering points. Its economy runs on piracy, smuggling, salvage, and increasingly legitimate trade as the Republic gains grudging recognition from its neighbors. Internal politics are volatile: alliances shift with the tides, and a charismatic captain can reshape policy overnight.",
        fields: {
          government_type: "republic",
          tech_level: "renaissance",
          magic_integration: "rare_elite",
          economic_system: "mixed",
          military_strength: "moderate",
          population_size: "Fifty to a hundred thousand, fluctuating with the season and the latest war",
          growth_status: "growing",
          diplomatic_stance: "aggressive",
          territory_description: "No contiguous territory \u2014 the Republic controls a shifting constellation of island harbors, hidden coves, and floating anchorages. Its true territory is the open sea itself, where its fleet is sovereign."
        }
      },
      {
        id: "living_city_civ",
        name: "Living City Civilization",
        description: "A civilization that IS its city \u2014 the settlement is a single vast organism its people live within.",
        element_type: "custom",
        summary: "A people who dwell inside their city because their city is alive \u2014 a symbiosis of organism and society",
        detailed_notes: "The Living City is not a metaphor. The city is a single colossal organism \u2014 part coral, part tree, part something with no natural analog \u2014 and its people live inside it like beneficial bacteria in a gut. The city grows walls, floors, and roofs from its own tissue. It circulates fresh air through breathing pores and clean water through vascular channels. It heals damage, seals breaches, and slowly expands to accommodate population growth. In return, the inhabitants feed it, tend to parasites and infections, and defend it from external threats. The relationship is deeply symbiotic: the people cannot survive without the city's shelter and infrastructure, and the city cannot survive without the people's care and nourishment. Governance is shaped by this relationship \u2014 the city's health is the supreme political concern, and those who can communicate with the organism (sensing its needs through vibrations in its walls) hold enormous influence.",
        fields: {
          government_type: "custom",
          tech_level: "custom",
          magic_integration: "fundamental",
          economic_system: "gift_economy",
          military_strength: "strong",
          population_size: "Hundreds of thousands living within the organism, which spans several square kilometers",
          growth_status: "stable",
          diplomatic_stance: "defensive",
          territory_description: "The civilization occupies exactly the area of the living organism \u2014 a single vast biological structure several kilometers across. There is no territory beyond the city-organism itself. External land is unclaimed and irrelevant; the city is their world."
        }
      },
      {
        id: "merchant_armada",
        name: "Merchant Armada",
        description: "A civilization of perpetually moving ships with no homeland, only fleet.",
        element_type: "nomadic",
        summary: "A floating nation of ships that has never known land \u2014 the sea is their country",
        detailed_notes: "The Merchant Armada is a civilization without territory in the conventional sense. Hundreds of ships \u2014 from massive cargo galleons to nimble scout vessels \u2014 form a perpetually moving fleet that trades between coastal civilizations. The fleet is their city: ships are lashed together in shifting configurations to form floating marketplaces, shipboard farms grow food in salt-resistant planters, and children are born, raised, and buried at sea. Political power belongs to the Fleet Admiral, elected by a council of ship captains, but real influence follows trade wealth. The Armada has no standing army \u2014 every merchant is armed, and the fleet can concentrate its firepower with devastating effect. Coastal nations tolerate and need them, as the Armada controls trade routes no single nation can dominate alone.",
        fields: {
          government_type: "oligarchy",
          tech_level: "renaissance",
          magic_integration: "regulated",
          economic_system: "mercantile",
          military_strength: "moderate",
          population_size: "Approximately 200,000 souls spread across a fleet of several hundred vessels",
          growth_status: "growing",
          diplomatic_stance: "mercantile",
          territory_description: "No land territory. The fleet itself is sovereign territory \u2014 a floating nation that follows trade winds and seasonal markets. Harbor agreements with coastal cities grant temporary docking rights but never permanent settlement."
        }
      },
      {
        id: "library_state",
        name: "Library State",
        description: "A civilization organized around knowledge preservation. Archivists rule.",
        element_type: "republic",
        summary: "A nation where knowledge is power \u2014 literally, as archivists govern by controlling access to information",
        detailed_notes: "The Library State was founded on a simple principle: whoever controls information controls everything. The entire civilization is organized around the collection, preservation, and controlled distribution of knowledge. Archivists \u2014 scholar-bureaucrats who have memorized vast catalogs and passed rigorous examinations \u2014 form the ruling class. Laws are written as cross-referenced documents, disputes are settled by precedent research, and social status is determined by one's access level within the great archives. The civilization is peaceful but not passive: it wages information warfare with devastating effectiveness, trading secrets and withholding knowledge as other nations use armies. Its greatest fear is not invasion but data loss \u2014 and its most severe crime is the destruction of records.",
        fields: {
          government_type: "republic",
          tech_level: "renaissance",
          magic_integration: "regulated",
          economic_system: "mixed",
          military_strength: "militia_only",
          population_size: "Roughly 2 million, concentrated in archive-cities",
          growth_status: "stable",
          diplomatic_stance: "diplomatic",
          territory_description: "A compact realm centered on the Great Archive \u2014 a city-sized complex of libraries, scriptoria, and vaults. Surrounding territories are organized as resource-producing provinces that support the archive's operation. Borders are precisely documented and aggressively defended through diplomacy rather than force."
        }
      },
      {
        id: "beast_riders",
        name: "Beast Riders",
        description: "A civilization built on bonded relationships with massive creatures.",
        element_type: "tribal_confederation",
        summary: "A confederation of clans, each bonded to a species of great beast that shapes their culture and warfare",
        detailed_notes: "The Beast Riders are a confederation of clans, each defined by its bonded creature. The Thunderhoof clan rides massive armored herbivores across open plains. The Skytalon clan soars on great raptors. The Deepscale clan navigates rivers and swamps on the backs of enormous reptiles. The bond between rider and beast is forged in youth through a dangerous ritual and lasts a lifetime \u2014 the death of one partner often kills the other through psychic shock. This bond is the foundation of their social structure: clan identity follows beast species, marriage between clans requires complex negotiation over which beast-bond the children will inherit, and political power belongs to those whose beasts are strongest. The confederation holds together because no single clan's beasts can dominate all terrains \u2014 cooperation is survival.",
        fields: {
          government_type: "tribal_council",
          tech_level: "iron_age",
          magic_integration: "rare_elite",
          economic_system: "barter",
          military_strength: "strong",
          population_size: "Several hundred thousand across all clans, with beast populations roughly a tenth of that",
          growth_status: "stable",
          diplomatic_stance: "defensive",
          territory_description: "Vast, varied territories matching the habitats of bonded beasts \u2014 open plains, mountain ranges, river deltas, and deep forests. Each clan controls the terrain its beasts are adapted to. Territorial boundaries follow ecological zones rather than political lines."
        }
      }
    ],
    defaultSortField: "government_type"
  };

  // src/domains/cultures.ts
  var culturesConfig = {
    id: "cultures",
    name: "Culture",
    namePlural: "Cultures",
    icon: "palette",
    color: "#e74c3c",
    description: "Define the living traditions, beliefs, languages, and customs that give your world's peoples their identity. Cultures exist within and across civilizations, carried by communities through art, ritual, cuisine, and shared memory.",
    tableName: "cultures",
    category: "sentient",
    fields: [
      {
        name: "civilization_ids",
        label: "Civilizations",
        type: "json",
        placeholder: '["civilization_id_1", "civilization_id_2"]',
        helpText: "The civilizations this culture exists within \u2014 cultures can span multiple civilizations or exist independently."
      },
      {
        name: "language_name",
        label: "Language Name",
        type: "text",
        required: true,
        placeholder: "e.g. Old Elvish, Trade Common, Deepspeak",
        helpText: "The primary language spoken by this cultural group."
      },
      {
        name: "writing_system",
        label: "Writing System",
        type: "text",
        placeholder: "e.g. runic, logographic, alphabetic, none (oral tradition)",
        helpText: "The writing system used, if any."
      },
      {
        name: "religion_name",
        label: "Primary Religion",
        type: "text",
        placeholder: "e.g. The Path of Embers, Ancestor Worship, secular",
        helpText: "The dominant religious or spiritual tradition."
      },
      {
        name: "values",
        label: "Core Values",
        type: "json",
        placeholder: '["honor", "knowledge", "community", "individual freedom"]',
        helpText: "The fundamental values that guide behavior and judgment in this culture."
      },
      {
        name: "customs",
        label: "Customs & Traditions",
        type: "json",
        placeholder: '["coming-of-age trials", "harvest festivals", "ancestor shrines"]',
        helpText: "Key customs, rituals, and social practices."
      },
      {
        name: "art_forms",
        label: "Art Forms",
        type: "json",
        placeholder: '["tapestry weaving", "bone carving", "throat singing"]',
        helpText: "Distinctive artistic expressions and creative traditions."
      },
      {
        name: "cuisine",
        label: "Cuisine",
        type: "textarea",
        placeholder: "Describe staple foods, cooking methods, dining customs...",
        helpText: "Distinctive foods, preparation methods, and dining traditions."
      },
      {
        name: "architecture_style",
        label: "Architecture Style",
        type: "text",
        placeholder: "e.g. living-wood towers, underground warrens, floating platforms",
        helpText: "Characteristic architectural forms and building philosophy."
      },
      {
        name: "social_hierarchy",
        label: "Social Hierarchy",
        type: "textarea",
        placeholder: "Describe the social classes, mobility, and status markers...",
        helpText: "How this culture organizes social status\u2014caste, merit, wealth, age, magical ability."
      },
      {
        name: "funerary_practices",
        label: "Funerary Practices",
        type: "textarea",
        placeholder: "Describe death rites, burial customs, mourning traditions...",
        helpText: "How this culture handles death \u2014 burial, cremation, sky burial, ancestor rites, mourning periods."
      },
      {
        name: "family_structure",
        label: "Family Structure",
        type: "textarea",
        placeholder: "Describe kinship systems, marriage customs, household composition...",
        helpText: "Kinship systems, marriage customs, household structures, and family obligations."
      },
      {
        name: "calendar_system",
        label: "Calendar System",
        type: "textarea",
        placeholder: "Describe how time is measured \u2014 months, festivals, eras...",
        helpText: "How this culture measures and marks time \u2014 calendar structure, significant dates, era reckoning."
      }
    ],
    elementTypes: ["ethnic_group", "subculture", "religious_order", "guild", "academic_tradition", "artistic_movement", "custom"],
    elementTypeDescriptions: {
      ethnic_group: "A people defined by shared ancestry, language, and traditions. The broadest cultural unit, often spanning multiple civilizations.",
      subculture: "A distinct community within a larger culture, defined by shared interests, practices, or identity that sets them apart.",
      religious_order: "An organized group united by shared spiritual beliefs, rituals, and hierarchy. May wield significant social or political influence.",
      guild: "A professional association of craftspeople, merchants, or specialists who regulate their trade and protect shared interests.",
      academic_tradition: "A school of thought, scholarly institution, or intellectual lineage that preserves and advances knowledge in specific fields.",
      artistic_movement: "A collective shift in creative expression \u2014 new styles, philosophies, or media that reshape how a culture sees itself.",
      custom: "A cultural grouping that doesn't fit standard categories \u2014 something unique to your world."
    },
    prompts: [
      "What do the people of this culture consider a life well lived? What virtues do they teach their children above all else?",
      "How do members of this culture mark the major transitions of life\u2014birth, coming of age, marriage, death?",
      "What foods are considered sacred, celebratory, or taboo? Does cuisine reflect the culture's history of abundance, scarcity, or trade?",
      "How does this culture relate to outsiders? Are they welcoming, isolationist, or something more complex?",
      "What stories do they tell about themselves? What is the founding myth, and how does it differ from historical reality?"
    ],
    magicPermeation: {
      companionTable: "cultures_magic_aspects",
      fields: [
        {
          name: "magical_traditions",
          label: "Magical Traditions",
          type: "textarea",
          helpText: "Distinct magical practices passed down through this culture\u2014hedge magic, ancestral summoning, dream-walking, etc."
        },
        {
          name: "arcane_religions",
          label: "Arcane Religions",
          type: "textarea",
          helpText: "Religions or spiritual practices centered around magical forces, deities of magic, or mana worship."
        },
        {
          name: "magical_art",
          label: "Magical Art",
          type: "textarea",
          helpText: "Art forms that incorporate magic\u2014illusion theater, enchanted music, living sculptures, spell-woven tapestries."
        },
        {
          name: "magical_festivals",
          label: "Magical Festivals",
          type: "textarea",
          helpText: "Celebrations tied to magical events\u2014mana tides, solstice surges, ley line alignments, summoning days."
        },
        {
          name: "magical_rites",
          label: "Magical Rites of Passage",
          type: "textarea",
          helpText: "Life transitions marked by magical rituals\u2014awakening ceremonies, binding oaths, spirit journeys."
        },
        {
          name: "attitudes_toward_practitioners",
          label: "Attitudes Toward Practitioners",
          type: "textarea",
          helpText: "How this culture views magic users\u2014as priests, scholars, dangers, servants, or something else entirely."
        },
        {
          name: "folk_magic",
          label: "Folk Magic",
          type: "textarea",
          helpText: "Everyday magical practices of common people\u2014ward signs, charm bags, blessing rituals, kitchen witchery."
        },
        {
          name: "magical_taboos",
          label: "Magical Taboos",
          type: "textarea",
          helpText: "Types of magic considered forbidden, immoral, or dangerous within this culture\u2014necromancy, blood magic, mind control."
        },
        {
          name: "magical_language",
          label: "Magical Language",
          type: "textarea",
          helpText: "How the culture's language incorporates magical concepts\u2014spell words, true names, power syllables, arcane grammar."
        },
        {
          name: "magical_cuisine",
          label: "Magical Cuisine",
          type: "textarea",
          helpText: "Foods and beverages with magical properties\u2014mana-infused drinks, enchanted feasts, alchemical cooking."
        },
        {
          name: "magical_fashion",
          label: "Magical Fashion",
          type: "textarea",
          helpText: "Enchanted clothing, warded jewelry, status-indicating magical accessories, glamour-based fashion."
        },
        {
          name: "magical_oral_traditions",
          label: "Magical Oral Traditions",
          type: "textarea",
          helpText: "Stories, songs, and spoken traditions that carry magical power\u2014true histories, prophecy ballads, naming songs."
        },
        {
          name: "magic_relevance",
          label: "Magic Relevance",
          type: "select",
          options: ["none", "minor", "moderate", "major", "fundamental"],
          helpText: "How central magic is to this culture's identity and daily life."
        },
        {
          name: "custom_magic_notes",
          label: "Custom Magic Notes",
          type: "textarea",
          placeholder: "Any additional notes about magical aspects...",
          helpText: "Free-form notes on magical properties not covered above."
        }
      ],
      manaSensitivity: "active",
      planeAware: false,
      prompts: [
        "How does this culture's relationship with magic shape its art, music, and storytelling? Are there art forms that literally cannot exist without magic?",
        "What magical practices are considered sacred versus profane? Do folk magic and institutional magic coexist or conflict?",
        "How do magical taboos reflect deeper cultural values? Is necromancy forbidden because of reverence for the dead, or fear of what the dead might say?"
      ]
    },
    archetypes: [
      {
        id: "warrior_honor",
        name: "Warrior Honor Culture",
        description: "A martial culture built around personal honor, combat prowess, and loyalty to one's war-band.",
        element_type: "ethnic_group",
        summary: "A proud warrior culture where glory in battle is the highest virtue",
        fields: {
          language_name: "(unnamed)",
          writing_system: "Runic script carved in stone and bone",
          religion_name: "Ancestor and hero worship",
          architecture_style: "Timber longhouses and hilltop fortifications",
          cuisine: "Hearty fare \u2014 roasted meats, root vegetables, mead, and fermented dairy. Feasting is a central social ritual with strict seating hierarchy.",
          social_hierarchy: "Warriors at the top, followed by free landowners, artisans, thralls. Status earned through combat deeds and gift-giving.",
          funerary_practices: "Honored dead are cremated on pyres with their weapons and treasures. Great heroes receive ship burials.",
          family_structure: "Extended clan-based households. Blood feuds between clans are common and can span generations."
        }
      },
      {
        id: "scholarly_tradition",
        name: "Scholarly Tradition",
        description: "A culture that venerates knowledge, debate, and the preservation of learning above all.",
        element_type: "academic_tradition",
        summary: "A culture that prizes wisdom, learning, and mastery of the written word",
        fields: {
          language_name: "(unnamed)",
          writing_system: "Elaborate calligraphic script with thousands of characters",
          religion_name: "Philosophical tradition emphasizing harmony and balance",
          architecture_style: "Walled academy complexes with libraries, observatories, and meditation gardens",
          cuisine: "Simple, refined meals emphasizing balance of flavors. Tea ceremonies are a major social institution.",
          social_hierarchy: "Scholar-officials at the top, selected by rigorous examination. Merchants rank below farmers in social theory, though not in practice.",
          funerary_practices: "Elaborate ancestor veneration with family shrines. The names and writings of great scholars are preserved for centuries.",
          family_structure: "Multigenerational households with strong filial obligations. Education of children is the paramount family duty."
        }
      },
      {
        id: "maritime_traders",
        name: "Maritime Traders",
        description: "A seafaring culture of merchants, navigators, and explorers who call the ocean home.",
        element_type: "ethnic_group",
        summary: "A salt-sprayed people whose home is the deck of a ship",
        fields: {
          language_name: "(unnamed)",
          writing_system: "Practical alphabetic script optimized for contracts and navigation logs",
          religion_name: "Polytheistic \u2014 sea gods, wind spirits, and star-guides",
          architecture_style: "Stilted waterfront buildings and fortified harbors with lighthouse towers",
          cuisine: "Seafood-heavy diet with preserved foods for long voyages \u2014 salted fish, hardtack, citrus fruits. Spice trade influences exotic blends.",
          social_hierarchy: "Ship captains and successful merchants hold highest status. Navigators are revered as near-priests. Landlocked peoples are viewed with mild pity.",
          funerary_practices: "The dead are committed to the sea in weighted shrouds. Captains are set adrift in their ships with the tide.",
          family_structure: "Fluid households \u2014 one parent often at sea for months. Extended dockside communities raise children collectively."
        }
      },
      {
        id: "agrarian_folk",
        name: "Agrarian Folk Culture",
        description: "A rooted, land-loving culture centered on farming, seasonal festivals, and community bonds.",
        element_type: "ethnic_group",
        summary: "A warm, rooted people whose lives follow the rhythm of the seasons",
        fields: {
          language_name: "(unnamed)",
          writing_system: "Simple phonetic script, primarily oral tradition",
          religion_name: "Earth-mother worship and seasonal fertility rites",
          architecture_style: "Thatched stone cottages, communal barns, and village greens",
          cuisine: "Seasonal, locally sourced \u2014 bread, cheese, preserved vegetables, orchard fruits. Harvest feasts and midsummer cookouts are cultural keystones.",
          social_hierarchy: "Relatively egalitarian. Village elders and large landowners have authority, but communal decision-making is the norm.",
          funerary_practices: "Buried in family plots on their own land, with a fruit tree planted over the grave. Annual remembrance at harvest time.",
          family_structure: "Nuclear families within tight village communities. Barn-raisings and harvest cooperation bind neighbors together."
        }
      },
      {
        id: "dream_weavers",
        name: "Dream Weaver Culture",
        description: "A culture built around shared dreaming \u2014 architecture, law, and art all exist primarily in the dream world.",
        element_type: "subculture",
        summary: "A people who live half their lives in a shared dreamscape they shape together",
        fields: {
          language_name: "(unnamed)",
          writing_system: "Dream-glyphs \u2014 symbols that trigger specific dream-images when viewed before sleep. Their libraries are pillows.",
          religion_name: "The Collective Dream \u2014 the shared dreamscape is considered sacred, and skilled dreamers are the clergy",
          architecture_style: "Waking-world structures are simple dormitories optimized for comfortable sleep. The true cities exist only in the shared dream \u2014 impossible spires, inverted oceans, and gardens of living light.",
          cuisine: "Light meals designed not to disrupt sleep. Herbal teas that deepen dreaming are the cultural staple. Feasting happens in the dream world where taste has no caloric limit.",
          social_hierarchy: "Lucid dreamers \u2014 those who can shape the shared dreamscape \u2014 hold the highest status. Dream-blind individuals (who cannot enter the shared dream) are a pitied underclass.",
          funerary_practices: "The dying perform a final dream-walk, leaving an echo of themselves in the shared dreamscape. The greatest dreamers persist as permanent dream-ghosts, becoming landmarks.",
          family_structure: "Dream-families often matter more than blood families. Children are raised communally in dream-nurseries where they learn to shape reality before they learn to walk."
        }
      },
      {
        id: "death_celebrants",
        name: "Death Celebrants",
        description: "A culture that celebrates death as the greatest transition. Elaborate funerary arts, ancestor veneration, and beautiful memorial traditions.",
        element_type: "religious_order",
        summary: "A joyful death-venerating culture that transforms grief into art and celebration",
        detailed_notes: "The Death Celebrants do not mourn \u2014 they celebrate. Death, in their belief, is not an ending but the greatest transition: a graduation, a homecoming, a metamorphosis. Their funerary rites are the most elaborate and beautiful events in their calendar, combining music, dance, feasting, and breathtaking memorial art. The dead are honored with joy, not sorrow, and weeping at a funeral is considered rude \u2014 it implies the deceased lived a life not worth celebrating. Ancestor veneration is central: the dead are consulted through rituals, their advice sought on matters of importance, their names woven into daily blessings. The culture produces extraordinary memorial artists \u2014 sculptors, composers, and poets whose life's work is to distill a person's essence into a lasting tribute. Outsiders often find them morbid, but the Death Celebrants consider other cultures' fear of death to be the true tragedy.",
        fields: {
          language_name: "(unnamed)",
          writing_system: "Ornamental script designed for memorial inscriptions \u2014 every letter is a small work of art",
          religion_name: "The Great Transition \u2014 death as sacred metamorphosis and reunion with ancestors",
          architecture_style: "Cathedral-ossuaries \u2014 soaring structures built from and decorated with the bones and ashes of honored ancestors. Beautiful, not macabre.",
          cuisine: "Feast cuisine designed for celebrations of death \u2014 elaborate multi-course meals where each dish represents a chapter of the deceased's life. Bitter herbs for hardship, sweet fruits for joy, fiery spices for passion.",
          social_hierarchy: "Memorial artists and death-priests hold the highest status. Age is deeply respected \u2014 the closer to the Great Transition, the more wisdom one carries. The young are cherished but considered unfinished.",
          funerary_practices: "Multi-day celebrations with music, storytelling, feasting, and the creation of a memorial artwork. The body is prepared with aromatic preservatives and displayed in a place of honor before being interred in the community ossuary.",
          family_structure: "Extended families spanning the living and the dead. Ancestor shrines are the heart of every home. Children are given the names of notable ancestors and expected to honor their namesake's legacy.",
          values: ["joyful acceptance of mortality", "remembrance", "artistic excellence", "ancestor reverence", "living fully"],
          customs: ["death-day celebrations", "ancestor consultation rituals", "memorial art commissions", "naming ceremonies linking newborns to ancestors"],
          art_forms: ["memorial sculpture", "funeral music", "life-story poetry", "bone-carving", "ash-glass craft"]
        }
      },
      {
        id: "silence_keepers",
        name: "Silence Keepers",
        description: "A culture that communicates through sign, writing, or telepathy. Speech is forbidden or sacred \u2014 silence holds power.",
        element_type: "subculture",
        summary: "A culture of profound silence where unspoken communication carries deeper meaning than words ever could",
        detailed_notes: "The Silence Keepers believe that spoken language is inherently imprecise, corrupting, or sacred \u2014 depending on the sect. Some hold that the voice carries a fragment of the soul, and to speak frivolously is to scatter oneself. Others believe that silence is the natural state of wisdom, and that speech is a crutch for minds too undisciplined for deeper communication. In practice, they communicate through an extraordinarily expressive sign language, written notes, facial expression, and \u2014 among the gifted \u2014 limited telepathy. Their communities are eerily quiet to outsiders: markets bustling with activity but no sound, children playing in perfect silence, councils debating through rapid hand-signs. The Silence Keepers are not mute \u2014 they can speak, and some rituals require the sacred act of breaking silence. But casual speech is considered vulgar, and a person who speaks without necessity loses social standing.",
        fields: {
          language_name: "(unnamed)",
          writing_system: "A highly developed ideographic script used for all formal communication. Quick shorthand variants exist for casual written conversation.",
          religion_name: "The Still Voice \u2014 a meditative tradition teaching that truth is found in silence and that the divine speaks only to those who stop talking",
          architecture_style: "Sound-dampening construction \u2014 thick walls, heavy curtains, soft floors. Public spaces are designed for sight-lines rather than acoustics. Bell towers exist but ring only for emergencies.",
          cuisine: "Communal silent meals are a bonding ritual. Food is simple and eaten mindfully. Crunchy or noisy foods are avoided in polite company. Tea is the social beverage \u2014 poured silently, shared in contemplation.",
          social_hierarchy: 'Those who have maintained unbroken silence for years or decades hold the highest status. Telepaths are respected but also slightly feared. The "loud" \u2014 those who speak too readily \u2014 occupy the lowest social tier.',
          funerary_practices: "The dead are mourned in absolute silence for three days. A single word \u2014 the deceased's true name \u2014 is spoken once at the burial by their closest companion. This is considered the most sacred utterance possible.",
          family_structure: "Families communicate through a private family sign-dialect that outsiders cannot fully understand. Parent-child bonds are expressed through touch and presence rather than verbal affection.",
          values: ["silence as power", "mindful communication", "inner discipline", "contemplation", "precision of expression"],
          customs: ["the Unspeaking (vow of extended silence)", "hand-sign debates", "silent market trading", "the Sacred Word ritual"],
          art_forms: ["visual storytelling", "sign-language poetry", "sand mandala", "silent theater", "calligraphy"]
        }
      },
      {
        id: "nomadic_storytellers",
        name: "Oral Tradition Keepers",
        description: "A culture whose entire history and law exists only in spoken word. The living memory, never written down.",
        element_type: "ethnic_group",
        summary: "A wandering people whose spoken stories ARE their civilization \u2014 destroy the stories, destroy the people",
        detailed_notes: "The Oral Tradition Keepers have no written language \u2014 by choice, not ignorance. They believe that writing kills knowledge by fixing it in place, making it rigid and dead. True knowledge, they hold, must live in a mind, be shaped by a voice, and breathe through retelling. Their entire legal code, history, genealogy, scientific knowledge, and spiritual tradition exists only in the memories of trained storytellers called Keepers. A Keeper begins training in childhood and spends decades memorizing thousands of stories, songs, and recitations with word-perfect accuracy. The loss of a Keeper before they can pass on their stories is a cultural catastrophe equivalent to the burning of a library. The culture is nomadic, traveling in small bands between seasonal camps, and the stories serve as their portable civilization \u2014 carrying everything they need to know in the minds of their people.",
        fields: {
          language_name: "(unnamed)",
          writing_system: "None \u2014 deliberately and philosophically rejected. Memory aids such as knotted cords and carved tokens exist but do not encode language.",
          religion_name: "The Living Word \u2014 the belief that spoken stories carry spiritual power and that the first story ever told created the world",
          architecture_style: "Portable camps \u2014 hide tents, woven shelters, and story-circles (cleared ground around a central fire where stories are told). No permanent structures.",
          cuisine: "Trail food and foraged meals that vary with the season and region. Cooking is accompanied by storytelling \u2014 recipes are themselves stories. Feast-stories are elaborate performances where food and narrative are served in courses together.",
          social_hierarchy: "Keepers (master storytellers) hold the highest status \u2014 they are the living repositories of the people's identity. Elders are revered for the stories they carry. Children are treasured as future vessels for knowledge.",
          funerary_practices: "When a person dies, their life is told as a story by those who knew them. If the story is compelling enough, it enters the collective tradition and the person achieves immortality. If not, they are mourned and released.",
          family_structure: "Extended family bands of 20-50 people who travel together. A Keeper belongs to the whole band, not to any single family. Marriage involves the interweaving of two families' stories into a shared narrative.",
          values: ["memory as sacred duty", "the spoken word as living truth", "community over individual", "the journey over the destination"],
          customs: ["nightly story-circles", "the Keeper's apprenticeship", "the Story-Walk (pilgrimage to retell stories at their origin sites)", "the Forgetting (ritual erasure of shamed events)"],
          art_forms: ["epic oral poetry", "call-and-response chanting", "rhythmic drumming", "story-dance", "knotwork memory aids"]
        }
      },
      {
        id: "mask_wearers",
        name: "Mask Wearers",
        description: "Everyone wears masks. Identity is the mask, not the face beneath.",
        element_type: "subculture",
        summary: "A culture where the mask IS the person \u2014 to remove it is to become no one",
        detailed_notes: "Among the Mask Wearers, a person's face is private in the same way other cultures consider nudity private \u2014 more so, in fact. Children receive their first mask at naming, and from that moment, they are never seen unmasked in public. The mask is not a disguise; it IS the identity. Changing masks means changing who you are \u2014 different masks for different social roles, with each mask carrying its own reputation, obligations, and relationships. A merchant mask conducts business; a parent mask raises children; a lover mask courts. The face beneath is considered sacred and unknowable, shared only in the most intimate moments. The culture's art, politics, and crime all revolve around masks: master mask-makers are the most revered artisans, stealing someone's mask is equivalent to murder, and the greatest philosophical question is whether there is a true self beneath all the masks or whether the masks are all there is.",
        fields: {
          language_name: "(unnamed)",
          writing_system: "Pictographic script where each character is a stylized mask representing a concept",
          religion_name: "The Faceless Divine \u2014 gods who have no true face, only infinite masks representing their aspects",
          architecture_style: "Buildings with masked facades \u2014 every structure has a decorative face. Interiors are plain and private.",
          cuisine: "Eaten in private or through specially designed mask-ports. Public dining is considered vulgar. Tea is sipped through mask-straws at social gatherings.",
          social_hierarchy: "Status is determined by the number and quality of masks one owns. Master mask-makers sit at the apex. The maskless are outcasts \u2014 either by punishment or poverty.",
          values: ["identity as performance", "privacy of the true self", "craftsmanship", "social fluidity", "the sacred unknowable"],
          customs: ["mask-naming ceremonies", "the Unmasking (intimate trust ritual)", "mask funerals (burying the mask, not the body)", "the Festival of New Faces"],
          art_forms: ["mask-making", "masked theater", "identity poetry", "face-painting (private, meditative art)", "mask-dance"]
        }
      },
      {
        id: "dream_architects",
        name: "Dream Architects",
        description: "A culture that builds primarily in shared dreams. Physical structures are secondary.",
        element_type: "artistic_movement",
        summary: "Visionary builders whose greatest works exist only in the shared dreamscape",
        detailed_notes: "The Dream Architects are an artistic and cultural movement that emerged when practitioners discovered how to create permanent structures in the shared dream plane. Their waking-world settlements are deliberately minimal \u2014 functional shelters for sleeping bodies \u2014 because their true creative energy goes into dream-construction. In the shared dreamscape, they build impossible architecture: towers that spiral into infinity, bridges spanning conceptual chasms, gardens where emotions grow as flowers. These dream-structures persist even when their creators wake, becoming shared cultural spaces where the community gathers, debates, worships, and creates art. The movement has attracted architects, artists, and visionaries from many cultures, united by the belief that physical reality is too constrained for true creative expression. Critics call them escapists; they call physical builders unimaginative.",
        fields: {
          language_name: "(unnamed)",
          writing_system: "Dream-inscription \u2014 text that can only be read while asleep, written in the logic of dreams rather than waking grammar",
          religion_name: "The Grand Design \u2014 the belief that the dream plane is the true reality and the waking world is a rough draft",
          architecture_style: "Waking-world: minimal sleeping pods and communal dream-halls. Dream-world: impossible geometries, living buildings, structures made of light, memory, and emotion.",
          cuisine: "Functional nutrition in the waking world \u2014 bland but efficient. In dreams, elaborate feasts of impossible flavors that nourish the spirit.",
          social_hierarchy: "Master Dream Architects who can create permanent dream-structures hold the highest status. Apprentices learn for decades. Those who cannot dream are excluded entirely.",
          values: ["creative vision", "transcendence of physical limits", "shared imagination", "impermanence as beauty", "the dream as truth"],
          customs: ["the First Dreaming (apprentice initiation)", "dream-gallery exhibitions", "collaborative dream-builds", "the Waking Fast (periods of enforced wakefulness for perspective)"],
          art_forms: ["dream architecture", "emotion sculpture", "memory mosaics", "impossible music", "narrative landscapes"]
        }
      },
      {
        id: "bone_singers",
        name: "Bone Singers",
        description: "A culture that crafts music from the remains of the honored dead.",
        element_type: "religious_order",
        summary: "A sacred musical tradition that transforms the bones of the beloved dead into instruments of remembrance",
        detailed_notes: "The Bone Singers believe that the dead live on in their bones, and that music is the language that bridges the living and the dead. When a person dies, their bones are carefully cleaned, blessed, and crafted into musical instruments by the order's artisans. A femur becomes a flute. A skull becomes a resonating drum. A ribcage becomes a xylophone. Each instrument carries the tonal signature of the person it was made from \u2014 experienced Bone Singers claim they can hear the deceased's voice in the harmonics. The music produced is haunting and beautiful, used in ceremonies, healing rituals, and communication with ancestors. Outsiders are often horrified, but the Bone Singers see their practice as the ultimate act of love: ensuring the dead are never silent, never forgotten, and always part of the community's living song.",
        fields: {
          language_name: "(unnamed)",
          writing_system: "Musical notation carved into bone \u2014 songs are their scriptures, and the instruments are their holy texts",
          religion_name: "The Eternal Song \u2014 the belief that all souls contribute to a cosmic melody, and death is merely a change in key",
          architecture_style: "Resonance halls built for acoustic perfection, with bone-instrument collections lining the walls like libraries. Ossuaries that double as concert halls.",
          cuisine: "Meals are always accompanied by music played on ancestor-instruments. Certain foods are associated with certain ancestors and eaten on their remembrance days.",
          social_hierarchy: "Master Bone Singers who can channel ancestral voices hold supreme authority. Instrument-crafters are sacred artisans. The tone-deaf are not shunned but serve as caretakers and listeners.",
          values: ["remembrance through music", "the sacred body", "ancestral continuity", "beauty in mortality", "harmony between living and dead"],
          customs: ["the Crafting (transforming a loved one's remains into an instrument)", "ancestor concerts on death anniversaries", "the Silence Before Song (mourning period before instrument-making)", "the Great Chorus (annual gathering where all instruments play together)"],
          art_forms: ["bone instrument crafting", "ancestral music composition", "harmonic channeling", "funeral song-writing", "resonance sculpture"]
        }
      },
      {
        id: "maritime_voyagers",
        name: "Maritime Voyagers",
        description: "A seafaring culture of merchants, navigators, and explorers who call the ocean home.",
        element_type: "ethnic_group",
        summary: "A people defined by the sea \u2014 their ships are their homes, the horizon their destination",
        detailed_notes: "Maritime Voyagers build their entire identity around the ocean. Their children learn to swim before they walk and to read the stars before they read text. Navigation is the highest art, and a captain who can find safe harbor in a storm is more respected than any king. Their language is rich with nautical metaphor, their religion centers on sea deities and the spirits of drowned ancestors, and their economy runs on trade between distant ports. They carry their culture in their ships \u2014 each vessel is a floating village with its own traditions, rivalries, and loyalties. Land-dwellers find them restless and untrustworthy; they find land-dwellers pitifully rooted.",
        fields: {
          language_name: "(unnamed)",
          writing_system: "Knot-based recording system for navigation and trade, supplemented by a phonetic script adapted from a trading partner",
          religion_name: "The Deep Current \u2014 worship of ocean spirits, drowned ancestors, and the great currents that connect all shores",
          architecture_style: "Shipboard \u2014 every structure is designed to be mobile. Permanent settlements are built on stilts over water or on floating platforms. Interiors are compact and multi-purpose.",
          cuisine: "Fish, seaweed, preserved meats, and tropical fruits traded at ports. Fermented fish sauce is the universal condiment. Fresh water is precious and never wasted.",
          social_hierarchy: "Captains at the top, then navigators, then sailors, then those who have never been to sea (the lowest status). Gender is irrelevant \u2014 only seamanship matters.",
          values: ["freedom of movement", "navigational skill", "trade fairness", "respect for the ocean", "hospitality to fellow sailors"],
          customs: ["the First Voyage (coming-of-age sail)", "storm songs (sung to calm the sea)", "port markets (temporary bazaars at every landing)", "the Captain's Word (absolute authority at sea)"],
          art_forms: ["sea shanties", "scrimshaw", "star charts", "ship carving", "wave-pattern weaving"]
        }
      }
    ],
    defaultSortField: "language_name"
  };

  // src/domains/magic-systems.ts
  var magicSystemsConfig = {
    id: "magic_systems",
    name: "Magic System",
    namePlural: "Magic Systems",
    icon: "sparkles",
    color: "#f39c12",
    description: "Define the fundamental rules, sources, and taxonomies of magic in your world. This is the master domain for all things magical\u2014energy types, laws, spell classifications, costs, and phenomena. The sub-tables handle the detailed breakdowns; this domain ties them together.",
    tableName: "world_elements",
    category: "magic",
    fields: [
      {
        name: "magic_philosophy",
        label: "Magic Philosophy",
        type: "textarea",
        placeholder: "Describe the overall paradigm \u2014 hard vs soft magic, deterministic vs chaotic, scientific vs mystical...",
        helpText: "The overarching philosophy or paradigm of this magic system \u2014 how rigorous, predictable, and systematized magic is in your world."
      },
      {
        name: "properties",
        label: "Properties",
        type: "json",
        placeholder: "{}",
        helpText: "Additional properties for this magic system element. The real detail lives in the magic sub-tables (sources, energy types, laws, taxonomies, materials, spells, costs, phenomena, power scaling)."
      }
    ],
    elementTypes: ["source", "energy_type", "law", "taxonomy", "material", "spell", "cost", "phenomenon", "power_tier"],
    elementTypeDescriptions: {
      source: "Where magic comes from \u2014 an ambient field, divine gift, biological trait, planar bleed, or something stranger entirely.",
      energy_type: "A distinct form of magical energy with its own properties \u2014 color, behavior, storage potential, and interactions with other types.",
      law: "A fundamental rule governing how magic works \u2014 conservation laws, forbidden actions, required conditions, or universal constraints.",
      taxonomy: "A classification system for organizing magic \u2014 schools, elements, traditions, or any framework practitioners use to categorize spells.",
      material: "A substance with inherent magical properties \u2014 crystals, herbs, metals, or exotic matter used in casting, crafting, or enchanting.",
      spell: "A discrete, repeatable magical effect that can be learned, cast, and classified within the magic system.",
      cost: "The price magic demands \u2014 physical toll, mental strain, life force, moral corruption, or other consequences of wielding power.",
      phenomenon: "A naturally occurring magical event \u2014 mana storms, wild magic surges, ley line eruptions, or ambient enchantments.",
      power_tier: "A level within the power scaling framework \u2014 defining what abilities, energy capacity, and status a practitioner holds."
    },
    prompts: [
      "What is the fundamental source of magic in your world? Is it an ambient energy field, a gift from deities, an innate biological trait, or something stranger?",
      "What are the hard limits of magic? Every compelling magic system has costs and constraints\u2014what can magic never do, and what price does it extract?",
      "How many distinct types of magical energy exist? Do they interact, combine, or cancel each other out?",
      "How is magic classified by its practitioners? Do they use schools, elements, colors, musical keys, or something unique to your world?",
      "What happens when magic goes wrong? Are there catastrophic failures, wild magic surges, or subtle corruptions that accumulate over time?"
    ],
    magicPermeation: null,
    defaultSortField: "name",
    archetypes: [
      {
        id: "ambient_field",
        name: "Ambient Mana Field",
        description: "Magic as a pervasive environmental energy that can be tapped, shaped, and depleted \u2014 like an invisible atmosphere of power.",
        element_type: "source",
        summary: "A pervasive energy field saturating the world, varying in density by region and influenced by geography, celestial events, and living things.",
        detailed_notes: "The ambient mana field is the most common source model for high-magic worlds. Mana exists everywhere but pools in certain locations (ley line intersections, ancient forests, mountain peaks) and thins in others (deserts, dead zones, heavily industrialized areas). Practitioners draw on this field to fuel spells, and overuse can locally deplete it, causing ecological consequences.",
        fields: {
          magic_philosophy: "Magic is a natural force, like gravity or electromagnetism. It can be studied, measured, and manipulated through learned techniques. The field is finite but renewable \u2014 it regenerates over time unless something disrupts the cycle."
        }
      },
      {
        id: "divine_gift",
        name: "Divine Gift",
        description: "Magic granted by gods to chosen mortals \u2014 prayers answered, blessings bestowed, and divine wrath unleashed.",
        element_type: "source",
        summary: "Magical power flows from deities to their worshippers, granted through prayer, devotion, or divine covenant.",
        detailed_notes: "In a divine gift system, mortals cannot generate magic on their own. All power comes from a patron deity, spirit, or cosmic entity. The relationship is transactional \u2014 devotion in exchange for power. Losing faith or breaking divine commandments can sever the connection entirely. Different gods grant different types of magic, creating natural factions among practitioners.",
        fields: {
          magic_philosophy: "Magic is a gift, not a right. It flows from beings of immense power to those they deem worthy. Understanding magic means understanding the will of the gods \u2014 theology and spellcasting are one and the same."
        }
      },
      {
        id: "blood_magic_law",
        name: "Law of Equivalent Exchange",
        description: "All magic requires sacrifice proportional to the effect \u2014 blood, life force, memories, or years of life.",
        element_type: "law",
        summary: "Every magical effect demands a cost equal in weight to what it produces. Nothing is created from nothing.",
        detailed_notes: "The Law of Equivalent Exchange is the central constraint of this magic system. Healing a wound means taking that wound onto yourself or another. Creating fire means draining heat from somewhere else. Raising the dead means someone else must die. The law is absolute and cannot be cheated \u2014 though many have tried, and the consequences of attempting to circumvent it are catastrophic. This creates inherent moral tension in every act of magic.",
        fields: {
          magic_philosophy: "Hard magic with absolute rules. The universe keeps a perfect ledger \u2014 every magical transaction must balance. Practitioners are as much accountants as wizards, calculating costs before casting."
        }
      },
      {
        id: "elemental_taxonomy",
        name: "Elemental Schools",
        description: "Magic classified into elemental categories \u2014 fire, water, earth, air, and stranger elements unique to your world.",
        element_type: "taxonomy",
        summary: "All magic is organized into elemental schools, each with distinct properties, techniques, and cultural associations.",
        detailed_notes: "The elemental taxonomy divides magic into fundamental categories based on the natural (or supernatural) elements. Classic systems use four or five elements, but this can expand to include light, shadow, metal, wood, void, time, or elements unique to your world. Each school has strengths, weaknesses, and interactions with others \u2014 fire beats wood, water douses fire, but what beats void? Practitioners typically specialize in one or two schools, and cultural traditions favor certain elements.",
        fields: {
          magic_philosophy: "Magic mirrors the structure of the natural world. Each element represents a fundamental force, and mastering an element means understanding its nature deeply. Cross-element casting is possible but exponentially harder."
        }
      },
      {
        id: "wild_surge",
        name: "Wild Magic Surge",
        description: "Uncontrolled magical eruptions that warp reality in unpredictable ways \u2014 beautiful, terrifying, and always unexpected.",
        element_type: "phenomenon",
        summary: "Spontaneous magical discharges that occur when ambient mana reaches critical density or when spellcasting fails catastrophically.",
        detailed_notes: "Wild magic surges are unpredictable eruptions of raw magical energy. They can turn stone to glass, reverse gravity locally, cause temporary time loops, or transform living creatures. Surges occur naturally in areas of high mana concentration but can also be triggered by botched spells, emotional extremes, or celestial alignments. Some cultures fear them as divine punishment; others seek them out for the unique magical effects they can produce. Entire ecosystems have evolved around surge-prone areas.",
        fields: {
          magic_philosophy: "A reminder that magic is fundamentally chaotic. No matter how much practitioners systematize it, raw mana is a wild force that resists complete control. Surges are the price of a world saturated with power."
        }
      },
      {
        id: "apprentice_to_archmage",
        name: "Apprentice-to-Archmage Scale",
        description: "A structured power progression from untrained novice to world-shaking archmage \u2014 with defined tiers, titles, and expectations.",
        element_type: "power_tier",
        summary: "A formal ranking system that categorizes magic users by their power, knowledge, and demonstrated ability.",
        detailed_notes: "This power scaling framework defines clear tiers of magical ability. At the bottom, Novices can barely light a candle. Apprentices learn fundamentals under a mentor. Journeymen can operate independently. Full Mages command significant power. Masters reshape local environments. Archmages can alter reality on a regional scale. Each tier requires years of study, specific trials or achievements, and carries social expectations and responsibilities. The framework is recognized across cultures, though different civilizations may use different names.",
        fields: {
          magic_philosophy: "Power is earned through disciplined study and practice. The ranking system reflects genuine differences in capability \u2014 it is meritocratic in theory, though politics and access to training create inequality in practice."
        }
      },
      {
        id: "innate_biological",
        name: "Innate Biological Magic",
        description: "Magic as a biological trait \u2014 some species or bloodlines are born with it, others never will be.",
        element_type: "source",
        summary: "Magical ability is encoded in biology \u2014 a gland, organ, or genetic trait that some creatures possess and others lack entirely.",
        detailed_notes: "In this system, magic is not learned but inherited. Certain species evolved magical organs (mana glands, aetheric nerves, resonance bones) that allow them to channel magical energy. Among species where magic is variable, it runs in bloodlines \u2014 magical families jealously guard their lineages. Those born without the trait can never learn magic, creating deep social divisions. Cross-breeding between magical and non-magical lines produces unpredictable results.",
        fields: {
          magic_philosophy: "Magic is biology, not philosophy. You either have the organ for it or you don't. Training refines what nature gave you, but it cannot create what isn't there. This makes magic inherently unequal \u2014 a fact that shapes every society it touches."
        }
      },
      {
        id: "mana_crystal",
        name: "Crystallized Mana",
        description: "Solid magic that can be mined, refined, traded, and consumed as fuel \u2014 the coal and oil of a magical economy.",
        element_type: "material",
        summary: "Mana that has solidified into physical crystals over millennia, forming extractable deposits deep underground.",
        detailed_notes: "Mana crystals form where ambient magical energy has pooled and compressed over geological timescales \u2014 often near ley line intersections or sites of ancient magical events. Raw crystals contain unfocused energy that must be refined before use. Different crystal colors indicate different magical affinities. The largest deposits drive entire economies, with mining towns, trade routes, and wars emerging around them. Crystals can be consumed (destroyed for a burst of power), embedded in devices (slow release), or ground into powder for potions and inks.",
        fields: {
          magic_philosophy: "Magic is a natural resource \u2014 finite, extractable, and valuable. Like any resource, it can be hoarded, traded, fought over, and eventually exhausted. The question every civilization faces: what happens when the crystals run out?"
        }
      },
      {
        id: "forbidden_spell",
        name: "Forbidden Working",
        description: "A spell so dangerous or morally abhorrent that all civilizations agree to ban it \u2014 but someone always tries.",
        element_type: "spell",
        summary: "A category of magic universally prohibited due to catastrophic risk, moral transgression, or both.",
        detailed_notes: "Forbidden workings are spells that cross lines every culture agrees should not be crossed. This might include true resurrection (which tears holes between the planes of living and dead), time reversal (which creates paradoxes that compound until reality breaks), or soul binding (which enslaves a consciousness for eternity). The ban is enforced by international treaty, religious doctrine, or magical failsafes built into the fabric of reality itself. Despite this, forbidden knowledge persists \u2014 hidden in sealed libraries, encoded in children's rhymes, or whispered by entities from other planes.",
        fields: {
          magic_philosophy: "Some doors are closed for a reason. Forbidden workings represent the ethical boundaries of magical practice \u2014 the recognition that power without restraint is not freedom but catastrophe."
        }
      },
      {
        id: "soul_cost",
        name: "Soul Erosion",
        description: "Every spell wears away a piece of the caster \u2014 personality, memory, emotion, or self slowly grinding down with each casting.",
        element_type: "cost",
        summary: "Casting magic gradually erodes the caster's soul, stripping away memories, emotions, personality traits, and eventually identity itself.",
        detailed_notes: "Soul erosion is the hidden price of magic. Each spell is small \u2014 you might forget a childhood afternoon, lose your taste for a favorite food, or find that anger comes slightly less easily. But over a lifetime of casting, the erosion compounds. Powerful mages are often hollow people \u2014 technically brilliant but emotionally flat, their personalities worn smooth like river stones. The most powerful archmages barely remember their own names. Some practitioners try to offset erosion by living intensely between castings, building up reserves of experience and emotion. Others accept the trade, viewing mortal attachments as distractions from pure magical pursuit.",
        fields: {
          magic_philosophy: "Magic takes what makes you human. The cost isn't physical pain or exhaustion \u2014 it's you. Every spell is a transaction where the currency is identity itself. The greatest mages are also the least recognizably themselves."
        }
      },
      {
        id: "runic_system",
        name: "Runic Inscription System",
        description: "Magic encoded in written symbols \u2014 carved, painted, or tattooed. The language of power, made literal.",
        element_type: "taxonomy",
        summary: "A magical framework where power is channeled through specific written symbols, each encoding a particular effect or concept.",
        detailed_notes: "In a runic system, magic is fundamentally linguistic. Each rune represents a concept (fire, protection, growth, binding) and drawing the rune correctly channels that concept into reality. Runes can be combined into sentences of power \u2014 complex enchantments built from simple components. The medium matters: runes carved in stone are permanent but inflexible; runes drawn in the air are fleeting but responsive; runes tattooed on skin are always available but limited in number. Different cultures have developed different runic alphabets, and translation between them is an advanced discipline. The act of writing new runes \u2014 encoding previously unexpressed concepts \u2014 is the highest form of magical research.",
        fields: {
          magic_philosophy: "Magic is language. Reality responds to being described in the right way, in the right symbols. Learning magic is learning to write in the tongue that the universe itself reads."
        }
      },
      {
        id: "music_magic",
        name: "Music Magic",
        description: "Magic cast through song, rhythm, and harmony. Each spell is a composition.",
        element_type: "taxonomy",
        summary: "A magical framework where spells are songs and power flows through melody, rhythm, and harmony",
        detailed_notes: "In music magic, every spell is a composition. Simple cantrips are single notes or short phrases; complex workings are symphonies requiring multiple casters performing in concert. Pitch determines the type of effect (high notes for light and air, low notes for earth and shadow), rhythm controls duration and intensity, and harmony allows multiple effects to be layered simultaneously. Solo practitioners are limited to what one voice or instrument can produce; the most powerful magic requires orchestras. Different musical traditions produce different magical styles \u2014 percussive war-magic, lilting healing songs, discordant curses, and the terrifying silence-magic of those who weaponize the absence of sound. Errors in performance cause proportional errors in the spell, making magical performance anxiety a literal occupational hazard.",
        fields: {
          magic_philosophy: "Magic is music \u2014 the universe vibrates at fundamental frequencies, and those who can match those frequencies with voice or instrument can reshape reality. Every practitioner is a performer, and every spell is a composition that must be executed with precision and feeling."
        }
      },
      {
        id: "contract_magic",
        name: "Contract Magic",
        description: "All magic requires a binding agreement. The universe itself enforces contracts.",
        element_type: "law",
        summary: "A legal framework of magic where every spell is a binding contract enforced by the fabric of reality itself",
        detailed_notes: "Contract magic operates on the principle that the universe is fundamentally legalistic. To cast a spell, a practitioner must draft a contract specifying exactly what they want, what they offer in exchange, and the terms and conditions of the effect. The contract can be with an element, a spirit, a concept, or reality itself. Once signed (in blood, mana, or true name), the contract is binding and self-enforcing \u2014 the universe ensures compliance from both parties. This makes magic extremely reliable but also dangerously literal. Poorly worded contracts produce technically correct but disastrous results. Loopholes are exploited by clever practitioners and cleverer entities. An entire legal profession has emerged around magical contract law, and the best magical lawyers are more feared than the most powerful combat mages.",
        fields: {
          magic_philosophy: "Magic is law. The universe operates on binding agreements, and power flows to those who can draft the most precise and advantageous contracts. Every spell is a negotiation, every enchantment a treaty, and every magical disaster a breach of contract with cosmic consequences."
        }
      },
      {
        id: "emotion_fuel",
        name: "Emotion-Fueled Magic",
        description: "Magic powered by the caster's emotions. Joy heals, rage destroys, grief wards.",
        element_type: "source",
        summary: "A magic system fueled by raw emotion \u2014 the deeper you feel, the more power you command",
        detailed_notes: "Emotion-fueled magic draws its power directly from the caster's emotional state. Joy produces healing and growth magic. Rage fuels destructive and combat magic. Grief creates powerful wards and barriers. Love enables enchantment and binding. Fear amplifies illusion and concealment. The system is intuitive \u2014 anyone who feels strongly can cast \u2014 but mastering it requires extraordinary emotional discipline. The most powerful practitioners are not those who suppress emotion but those who can summon genuine, intense feeling on demand and then channel it precisely. This creates a paradox: the best emotion-mages are simultaneously the most emotionally volatile and the most emotionally controlled people alive. The system has dark implications: some practitioners cultivate suffering in themselves or others to fuel their magic, and the line between therapeutic emotional expression and exploitative emotional harvesting is dangerously thin.",
        fields: {
          magic_philosophy: "Magic is feeling. The heart is the organ of power, not the mind. Emotional authenticity is the key to magical strength \u2014 forced or false emotions produce weak, unstable effects. The universe responds to genuine passion, making magic an inherently personal and unpredictable art."
        }
      }
    ]
  };

  // src/domains/planar-systems.ts
  var planarSystemsConfig = {
    id: "planar_systems",
    name: "Planar System",
    namePlural: "Planar Systems",
    icon: "layers",
    color: "#3498db",
    description: "Map the planes of existence that compose your world's cosmological structure. From the primary material plane to elemental realms, shadow dimensions, and divine domains\u2014define the multiverse and the connections between its layers.",
    tableName: "planes",
    category: "magic",
    fields: [
      {
        name: "plane_type",
        label: "Plane Type",
        type: "select",
        required: true,
        options: ["material", "astral", "elemental", "shadow", "ethereal", "divine", "demonic", "fey", "dream", "temporal", "void", "mirror", "pocket", "demiplane", "custom"],
        helpText: "The fundamental classification of this plane of existence."
      },
      {
        name: "is_primary_material",
        label: "Is Primary Material Plane",
        type: "boolean",
        helpText: "Whether this is the primary material plane where most mortal life exists."
      },
      {
        name: "parent_plane_id",
        label: "Parent Plane",
        type: "text",
        placeholder: "ID of the containing or parent plane",
        helpText: "The plane that contains or spawned this one, if any (e.g. a demiplane within the Astral)."
      },
      {
        name: "accessibility",
        label: "Accessibility",
        type: "textarea",
        placeholder: "How can this plane be reached? Portals, rituals, death, dreams...",
        helpText: "Methods of travel to and from this plane\u2014natural portals, spells, conditions, or restrictions."
      },
      {
        name: "physical_laws",
        label: "Physical Laws",
        type: "json",
        placeholder: '{"gravity": "reversed", "time": "accelerated", "matter": "fluid"}',
        helpText: "How the fundamental laws of physics differ from the material plane."
      },
      {
        name: "magic_laws_override",
        label: "Magic Laws Override",
        type: "textarea",
        helpText: "How the rules of magic change in this plane\u2014amplified schools, forbidden spells, wild magic zones."
      },
      {
        name: "dominant_energy_type_id",
        label: "Dominant Energy Type",
        type: "text",
        placeholder: "ID of the primary magical energy type",
        helpText: "The magical energy type that dominates or saturates this plane."
      },
      {
        name: "time_flow_rate",
        label: "Time Flow Rate",
        type: "text",
        placeholder: "e.g. 1:1, 1:100 (1 day = 100 days material), stopped, variable",
        helpText: "How time passes relative to the material plane."
      },
      {
        name: "spatial_properties",
        label: "Spatial Properties",
        type: "select",
        options: ["euclidean", "non_euclidean", "infinite", "finite_bounded", "looping", "fractal", "subjective", "layered", "custom"],
        helpText: "The geometric and spatial nature of this plane."
      },
      {
        name: "native_environment",
        label: "Native Environment",
        type: "textarea",
        placeholder: "Describe the default landscape, atmosphere, and conditions...",
        helpText: "The baseline environmental conditions that prevail across this plane."
      },
      {
        name: "stability",
        label: "Stability",
        type: "select",
        options: ["permanent", "stable", "fluctuating", "unstable", "collapsing", "forming", "ephemeral"],
        helpText: "How structurally stable this plane is over time."
      },
      {
        name: "age",
        label: "Age",
        type: "text",
        placeholder: "e.g. primordial, 10,000 years, recent creation",
        helpText: "How old this plane is, or when it came into existence."
      },
      {
        name: "creation_myth",
        label: "Creation Myth",
        type: "textarea",
        placeholder: "How was this plane created? By whom or what?",
        helpText: "The origin story of this plane\u2014divine creation, magical accident, natural emergence, or unknown."
      },
      {
        name: "inhabitants",
        label: "Inhabitants",
        type: "textarea",
        placeholder: "Describe who or what lives in this plane...",
        helpText: "The beings, entities, and civilizations native to or residing in this plane."
      },
      {
        name: "hazards",
        label: "Hazards",
        type: "textarea",
        placeholder: "Describe environmental dangers, hostile entities, reality distortions...",
        helpText: "Dangers that threaten visitors \u2014 environmental hazards, hostile natives, reality distortions, madness effects."
      }
    ],
    elementTypes: ["material", "astral", "elemental", "shadow", "ethereal", "divine", "demonic", "fey", "dream", "temporal", "void", "mirror", "pocket", "demiplane", "custom"],
    elementTypeDescriptions: {
      material: "The primary physical reality where mortal life exists. Solid, tangible, and governed by natural law \u2014 the foundation plane.",
      astral: "A plane of thought, psychic energy, and the silver void between other planes. Travel here is often mental rather than physical.",
      elemental: "A plane of pure elemental force \u2014 fire, water, earth, air, or stranger elements in their most primal, concentrated form.",
      shadow: "A dark reflection of the material world, drained of color and warmth. Home to shadow creatures and negative energy.",
      ethereal: "A misty, overlapping plane that coexists with the material world. Ghosts and phase-shifted travelers walk here unseen.",
      divine: "A plane shaped by and belonging to a deity or pantheon. Its nature reflects the god's domain and personality.",
      demonic: "A plane of corruption, chaos, or infernal energy. Home to demons, devils, or whatever dark beings your world names.",
      fey: "A plane of wild, untamed nature and capricious magic. Time flows strangely, and beauty hides danger.",
      dream: "A plane formed from the collective unconscious \u2014 shaped by the dreams, nightmares, and imaginations of sleeping minds.",
      temporal: "A plane where time itself is a navigable dimension. Past, present, and future may coexist or branch.",
      void: "The empty space between planes \u2014 nothingness given form, or the absence that existed before creation.",
      mirror: "A reversed reflection of another plane, where familiar things are distorted, inverted, or subtly wrong.",
      pocket: "A small, self-contained plane \u2014 a bubble of reality with its own rules, often artificially created.",
      demiplane: "A minor plane crafted by a powerful being. Limited in scope but fully sovereign in its own laws.",
      custom: "A plane that doesn't fit standard categories \u2014 something unique to your world's cosmology."
    },
    prompts: [
      "How are the planes of your world arranged? Is there a clear hierarchy (inner/outer planes), a web of connections, or something more chaotic?",
      "What happens to a mortal body when it crosses into another plane? Can flesh survive in the Elemental Plane of Fire, or does travel require transformation?",
      "Do the planes bleed into each other at weak points? What do these planar crossings look like, and who or what guards them?",
      "How does time flow differently across the planes? Has anyone exploited this for strategic advantage\u2014or been trapped by it?",
      "Are new planes still being created? Can a sufficiently powerful mage or deity forge a demiplane, and what are the consequences?"
    ],
    magicPermeation: null,
    archetypes: [
      {
        id: "material_plane",
        name: "Material Plane",
        description: "The primary physical reality where mortal life exists \u2014 the foundation of the planar cosmology.",
        element_type: "material",
        summary: "The foundational plane of physical reality",
        fields: {
          plane_type: "material",
          is_primary_material: true,
          spatial_properties: "euclidean",
          stability: "permanent",
          time_flow_rate: "Standard \u2014 all other planes measured relative to this one",
          native_environment: "An infinite expanse containing stars, planets, and the void between them. Physical laws are consistent and predictable.",
          accessibility: "The default plane of existence. All portals and planar travel originate from or pass through here."
        }
      },
      {
        id: "elemental_realm",
        name: "Elemental Realm",
        description: "A plane of pure elemental energy \u2014 fire, water, earth, or air in its most primal form.",
        element_type: "elemental",
        summary: "A plane of pure elemental force, hostile to mortal life",
        fields: {
          plane_type: "elemental",
          is_primary_material: false,
          spatial_properties: "infinite",
          stability: "stable",
          time_flow_rate: "Roughly equivalent to the material plane",
          native_environment: "An infinite expanse dominated by a single element in its purest form. The Plane of Fire is an endless inferno; the Plane of Water, a boundless ocean without surface or floor.",
          hazards: "Unprotected mortals face instant death from environmental exposure. Elemental storms can reshape vast regions without warning.",
          inhabitants: "Elemental beings of varying intelligence \u2014 from mindless motes to ancient elemental lords of godlike power."
        }
      },
      {
        id: "shadow_plane",
        name: "Shadow Plane",
        description: "A dark reflection of the material world, drained of color and infused with negative energy.",
        element_type: "shadow",
        summary: "A twilight mirror-world where reality frays at the edges",
        fields: {
          plane_type: "shadow",
          is_primary_material: false,
          spatial_properties: "non_euclidean",
          stability: "fluctuating",
          time_flow_rate: "Subjective \u2014 hours can pass as minutes, or days as moments",
          native_environment: "A dim, desaturated mirror of the material plane. Familiar landmarks exist but warped \u2014 buildings crumble, forests are skeletal, distances shift. Perpetual twilight.",
          hazards: "Prolonged exposure drains vitality and color from living beings. Shadow creatures hunt by sensing life-force. Navigation is unreliable as geography shifts.",
          accessibility: "Accessible through deep shadows, mirrors at midnight, or necromantic rituals. The barrier thins near sites of death and despair."
        }
      },
      {
        id: "fey_wilds",
        name: "Fey Wilds",
        description: "A plane of wild, untamed nature and capricious magic, home to the fey courts.",
        element_type: "fey",
        summary: "An enchanted wilderness ruled by the mercurial fey courts",
        fields: {
          plane_type: "fey",
          is_primary_material: false,
          spatial_properties: "subjective",
          stability: "fluctuating",
          time_flow_rate: "Wildly inconsistent \u2014 a night in the Feywild might be a year in the material plane, or vice versa",
          native_environment: "A hyper-vivid version of the natural world \u2014 colors are brighter, emotions more intense, seasons change with the moods of the fey courts. Ancient forests stretch forever.",
          hazards: "Time dilation can strand travelers for decades. Fey bargains are binding and literally enforced. Consuming fey food may trap you permanently.",
          inhabitants: "The Seelie and Unseelie courts, nature spirits, talking beasts, trickster sprites, and ancient beings of terrifying beauty."
        }
      },
      {
        id: "living_plane",
        name: "The Living Plane",
        description: "This plane IS a creature. Its terrain is flesh, its weather is breath, and its earthquakes are heartbeats.",
        element_type: "custom",
        summary: "A plane of existence that is itself a living, thinking entity",
        fields: {
          plane_type: "custom",
          is_primary_material: false,
          spatial_properties: "non_euclidean",
          stability: "fluctuating",
          time_flow_rate: "Tied to the entity's biological rhythms \u2014 time accelerates when it's active, nearly stops when it sleeps",
          native_environment: `The "ground" is warm and faintly pulsing. Rivers carry a fluid that isn't quite water. Mountains rise and fall over decades like slow breathing. The sky is a membrane, and beyond it \u2014 another organ.`,
          hazards: "The entity's immune system attacks intruders. Antibody-creatures hunt foreign beings. Staying too long risks being absorbed and becoming part of the plane. If the entity dreams, local reality warps to match.",
          inhabitants: "Symbiotic cultures that have adapted to life inside the entity \u2014 they maintain its health in exchange for shelter. Parasitic factions also exist, and the war between symbiote and parasite defines planar politics."
        }
      },
      {
        id: "bleeding_wound",
        name: "Planar Wound",
        description: "A place where two planes overlap and merge. Reality is unstable \u2014 physics from both planes apply simultaneously.",
        element_type: "pocket",
        summary: "A rift where two planes bleed into each other, creating a zone of dual reality",
        detailed_notes: "Planar wounds occur when the barrier between two planes ruptures rather than forming a clean portal. The result is a region where both sets of physical laws, magic rules, and environmental conditions coexist. Gravity might pull in two directions. Fire and water occupy the same space. Creatures from both planes wander in, confused and hostile. The wound may heal on its own, be sealed by powerful magic, or slowly widen until one plane consumes the other.",
        fields: {
          plane_type: "pocket",
          is_primary_material: false,
          spatial_properties: "non_euclidean",
          stability: "unstable",
          time_flow_rate: "Erratic \u2014 time stutters and lurches as two temporal flows compete for dominance",
          native_environment: "A surreal landscape where terrain from both planes intermingles. Trees made of crystal grow from volcanic soil. Snow falls upward into a burning sky. The boundaries shift constantly, and pockets of pure reality from either plane form and dissolve.",
          accessibility: "Planar wounds are visible from both planes as shimmering distortions. Walking into one is easy \u2014 walking out is harder, as the exit shifts with each fluctuation.",
          hazards: "Contradictory physics can tear matter apart. Visitors may be subject to two gravities, two atmospheres, or two magical fields at once. Creatures native to one plane may be hostile to beings from the other. Reality storms sweep through without warning.",
          inhabitants: "Scavengers and refugees from both planes, along with hybrid creatures that have adapted to the dual-reality environment. Some scholars and mages study wounds at great personal risk."
        }
      },
      {
        id: "prison_plane",
        name: "Sealed Prison Plane",
        description: "A plane designed to contain something \u2014 sealed by ancient magic, now weakening. What's inside wants out.",
        element_type: "demiplane",
        summary: "A demiplane constructed as an inescapable prison, its seals now failing",
        detailed_notes: "Prison planes are purpose-built demiplanes designed to contain entities too powerful to destroy. The original architects layered redundant seals, self-repairing wards, and reality-anchors to prevent escape. But nothing lasts forever. Entropy, external interference, or the sheer will of the prisoner has weakened the bindings. The plane itself may be aware of its purpose, actively working to maintain containment \u2014 or it may have been corrupted by its prisoner over the millennia.",
        fields: {
          plane_type: "demiplane",
          is_primary_material: false,
          spatial_properties: "finite_bounded",
          stability: "unstable",
          time_flow_rate: "Deliberately slowed \u2014 one year inside equals a century outside, to make the sentence feel shorter to the prisoner and longer to the world",
          native_environment: "The interior reflects the nature of the prisoner. A demon's prison is scorched and sulfurous. An elder god's prison is a void of maddening geometry. The walls are inscribed with containment runes that pulse with fading light.",
          accessibility: "Sealed by layers of ancient magic. The original keys were destroyed or hidden. Some seals have cracked, allowing whispers and influence to leak out \u2014 and occasionally letting foolish explorers in.",
          hazards: "The prisoner's influence pervades everything. Dreams turn to nightmares near the inner seals. The plane itself may test intruders, unable to distinguish between would-be liberators and inspectors. If the prisoner escapes, the plane collapses.",
          inhabitants: "The prisoner and whatever lesser beings have been drawn in or created by the prisoner's residual power. Guardian constructs built by the original architects may still patrol, though their loyalty is uncertain after so long.",
          creation_myth: "Built by a coalition of the most powerful mages and gods of a prior age, at tremendous cost. The construction itself is a historical event \u2014 entire civilizations contributed resources and lives to the project."
        }
      },
      {
        id: "echo_plane",
        name: "Echo Plane",
        description: "A plane that replays past events on an eternal loop. Walk through frozen moments in history.",
        element_type: "temporal",
        summary: "A temporal plane where history replays in an endless, unchangeable cycle",
        detailed_notes: "Echo planes are temporal anomalies where significant historical events have been imprinted so deeply into the fabric of reality that they replay endlessly. Visitors can walk through ancient battles, witness forgotten rituals, or observe the daily life of civilizations that vanished millennia ago. The echoes are not aware of observers and cannot be interacted with \u2014 they are recordings, not time travel. However, some echoes have begun to deviate from their original patterns, suggesting the plane itself may be developing a form of memory or intent.",
        fields: {
          plane_type: "temporal",
          is_primary_material: false,
          spatial_properties: "looping",
          stability: "stable",
          time_flow_rate: "Cyclical \u2014 each loop replays the same period of time, typically lasting hours to days before resetting. Visitors experience time normally but the environment resets around them.",
          native_environment: "A perfect recreation of the time and place being echoed. A battle-echo shows the battlefield in pristine detail \u2014 the weather, the terrain, the armies. Between loops, the plane goes dark and still for a brief, unsettling moment before snapping back to the beginning.",
          accessibility: "Echo planes form naturally at sites of tremendous historical significance. Accessing them requires temporal magic or stumbling through a thin spot at exactly the right moment in the loop cycle.",
          hazards: 'Becoming "entrained" in the loop \u2014 visitors who stay too long begin to fade into the echo, becoming part of the replay. Temporal disorientation makes it difficult to distinguish echo from reality. Some echoes contain events so traumatic that witnessing them causes psychic damage.',
          inhabitants: "The echoes themselves are not truly alive, but some echo planes have attracted temporal scholars, historians seeking primary sources, and ghosts who have confused the echo for their actual past."
        }
      },
      {
        id: "memory_palace",
        name: "Memory Palace",
        description: "A plane formed from the accumulated memories of all who have died.",
        element_type: "dream",
        summary: "A vast plane built from the collected memories of the dead \u2014 an afterlife of recollection",
        detailed_notes: "The Memory Palace is not a single palace but an ever-expanding plane constructed from the memories of every sentient being who has ever died. Upon death, a being's memories are absorbed into the plane, manifesting as physical locations \u2014 a beloved childhood home becomes a room, a lifetime of travel becomes a corridor of landscapes, a traumatic memory becomes a locked chamber. The plane is navigable but disorienting: walking through a door might take you from a farmer's sunset memory into a general's battlefield recollection. Explorers who visit seek lost knowledge, messages from the dead, or simply the experience of walking through another person's life. The danger is becoming lost \u2014 the plane is infinite and growing, and the memories are seductive. Many visitors become absorbed, their own memories merging with the plane while their bodies waste away in the material world.",
        fields: {
          plane_type: "dream",
          is_primary_material: false,
          spatial_properties: "subjective",
          stability: "stable",
          time_flow_rate: "Subjective \u2014 a visitor can experience years of memories in hours, or hours of memories in years. Time follows emotional weight, not clocks.",
          native_environment: "An infinite labyrinth of remembered places \u2014 sunlit kitchens, rain-soaked battlefields, childhood bedrooms, alien landscapes. Each space is vivid and detailed, drawn from the actual memories of the dead. The architecture is impossible, connecting memories from different lives and eras without regard for geography or chronology.",
          accessibility: "Accessible through deep meditation at sites of mass death, necromantic rituals, or natural planar thin-spots at ancient cemeteries. Some claim to reach it through intense nostalgia.",
          hazards: "Memory absorption \u2014 visitors begin reliving others' memories as their own, losing track of their identity. Traumatic memories manifest as hostile environments. The deeper one travels, the older and more alien the memories become, pre-dating any living culture.",
          inhabitants: "Memory echoes of the dead \u2014 not ghosts, but vivid impressions that behave as the original person would have in that memory. They cannot learn or change. Rare visitors who became permanently absorbed wander as confused shades carrying fragments of hundreds of identities."
        }
      },
      {
        id: "inverse_plane",
        name: "Inverse Plane",
        description: "Where physical laws are reversed: fire cools, gravity repels, light darkens.",
        element_type: "mirror",
        summary: "A mirror-world where every physical law operates in reverse \u2014 beautiful, deadly, and deeply wrong",
        detailed_notes: "The Inverse Plane is a reflection of the material world where every fundamental law operates in reverse. Fire absorbs heat, making things colder. Gravity pushes away from mass, requiring travelers to anchor themselves to surfaces. Light creates darkness, and shadows illuminate. Sound travels backward \u2014 you hear words before they are spoken. Healing magic causes harm, and harmful magic heals. The plane is not malicious; it simply runs on opposite principles. For scholars, it is an invaluable laboratory for understanding physical laws by observing their negation. For travelers, it is a nightmare of constant counter-intuitive danger where every survival instinct is exactly wrong.",
        fields: {
          plane_type: "mirror",
          is_primary_material: false,
          spatial_properties: "euclidean",
          stability: "stable",
          time_flow_rate: "Reversed in perception \u2014 inhabitants experience events in reverse chronological order, though visitors retain their normal time-sense, creating disorienting interactions.",
          native_environment: "A landscape recognizable as a distorted reflection of the material plane, but wrong in every detail. Rivers flow uphill. Rain falls upward from the ground. Trees grow downward from a soil-sky. The horizon curves the wrong way.",
          accessibility: "Accessible through perfectly reflective surfaces under specific conditions \u2014 mirrors at midnight, still pools during eclipses, or polished metal at the moment of a law's reversal (a fire going out, an object reaching the apex of a throw).",
          hazards: "Every survival instinct is inverted. Running from danger brings you closer. Shielding yourself with armor makes you more vulnerable. Eating nourishing food starves you. Breathing fresh air suffocates. Visitors must consciously override every natural impulse.",
          inhabitants: "Inverse beings \u2014 creatures that evolved under reversed physics and find the material plane as hostile as visitors find theirs. Rare scholars maintain research outposts at the boundary, studying inverse physics from a safe distance."
        }
      },
      {
        id: "boundary_plane",
        name: "Boundary Plane",
        description: "Exists only at the borders between other planes. Impossibly thin.",
        element_type: "pocket",
        summary: "A plane that exists only in the spaces between other planes \u2014 an infinitely thin membrane separating realities",
        detailed_notes: "The Boundary Plane has no interior \u2014 it is pure edge. It exists as the membrane separating every other plane from its neighbors, an infinitely thin space that is somehow navigable. Travelers who enter the Boundary Plane can walk along the borders between realities, peering into adjacent planes through the translucent membrane on either side. The plane is invaluable for planar cartographers, as it provides a map of the entire cosmological structure \u2014 every plane is visible as a neighboring surface, and their relative positions and connections can be studied. However, the Boundary Plane is structurally fragile. Puncturing the membrane in either direction opens a rift between the planes on each side, and the Boundary Plane itself can tear, creating planar wounds. Those who dwell here \u2014 and a few beings do \u2014 are obsessed with maintaining the membrane's integrity, viewing themselves as custodians of cosmological stability.",
        fields: {
          plane_type: "pocket",
          is_primary_material: false,
          spatial_properties: "non_euclidean",
          stability: "fluctuating",
          time_flow_rate: "Variable \u2014 time in the Boundary Plane matches whichever adjacent plane exerts the stronger temporal influence at any given point, creating zones of different time flow along its length.",
          native_environment: "An impossibly thin corridor with translucent walls on either side, through which the adjacent planes are dimly visible. The floor is the membrane itself \u2014 firm but flexible, vibrating with the energies of neighboring realities. Colors shift as one walks, reflecting the nature of the planes on either side.",
          accessibility: "Accessible at points where two planes nearly touch \u2014 planar thin-spots, portal edges, and the margins of demiplanes. Experienced planar travelers can slip sideways into the Boundary at any inter-planar crossing.",
          hazards: "The membrane is thin and fragile \u2014 careless movement or combat can puncture it, opening rifts between adjacent planes with catastrophic results. Spatial compression means distance is unreliable. The plane narrows to nothing at certain points, trapping the unwary.",
          inhabitants: "The Membrane Wardens \u2014 ancient beings of unknown origin who patrol the Boundary Plane, repairing tears and sealing rifts. They do not communicate with visitors but will violently expel anyone who damages the membrane."
        }
      },
      {
        id: "shadow_realm",
        name: "Shadow Realm",
        description: "A dark reflection of the material world, drained of color and warmth.",
        element_type: "shadow",
        summary: "A bleak mirror-world of twilight and decay where light goes to die",
        fields: {
          plane_type: "shadow",
          is_primary_material: false,
          spatial_properties: "non_euclidean",
          stability: "fluctuating",
          time_flow_rate: "Subjective \u2014 time stretches and compresses without pattern",
          native_environment: "A desaturated echo of the material world. Structures exist in decayed form, landscapes are muted and distorted, and a perpetual grey twilight hangs over everything. Sound is muffled. Colors drain from visitors the longer they stay.",
          hazards: "Life force drains slowly but relentlessly. Shadow creatures stalk anything that radiates warmth or light. Emotional despair deepens with exposure, and prolonged stays risk permanent loss of vitality.",
          accessibility: "Thin spots form in deep shadows, graveyards, and places of despair. Necromantic rituals and shadow magic can open passages deliberately."
        }
      },
      {
        id: "elemental_bastion",
        name: "Elemental Bastion",
        description: "A plane of pure elemental force in its most concentrated form.",
        element_type: "elemental",
        summary: "A fortress-plane of pure elemental power, overwhelming and absolute",
        fields: {
          plane_type: "elemental",
          is_primary_material: false,
          spatial_properties: "infinite",
          stability: "stable",
          time_flow_rate: "Roughly equivalent to the material plane",
          native_environment: "An infinite expanse of a single element at its most extreme \u2014 an ocean of liquid fire, a continent of living stone, an endless hurricane, or an abyss of crushing water. No compromise, no mixture, no mercy.",
          hazards: "Instant death for unprotected mortals. The element is not hostile \u2014 it simply IS, and anything that cannot survive pure elemental force is destroyed by proximity.",
          inhabitants: "Elemental lords of immense power rule territories within the bastion. Lesser elementals swarm like wildlife. Rare mortal outposts exist inside protective wards, trading with elementals for raw materials."
        }
      },
      {
        id: "fey_wild",
        name: "Fey Wild",
        description: "A plane of untamed nature and capricious magic, home to the fey courts.",
        element_type: "fey",
        summary: "An enchanted wilderness where beauty and danger are the same thing",
        fields: {
          plane_type: "fey",
          is_primary_material: false,
          spatial_properties: "subjective",
          stability: "fluctuating",
          time_flow_rate: "Wildly variable \u2014 a day here might be a year in the material plane, or a century might pass in an afternoon",
          native_environment: "A hyper-saturated version of the natural world \u2014 colors painfully vivid, emotions magnified, seasons shifting with the whims of the fey courts. Forests stretch beyond reason, rivers sing, and flowers watch you pass.",
          hazards: "Time dilation strands travelers for lifetimes. Fey bargains are magically binding and always have a hidden cost. Eating fey food binds you to the plane. Beauty itself is dangerous \u2014 visitors forget to leave.",
          inhabitants: "The Seelie and Unseelie courts vie for dominance. Trickster sprites, ancient treants, talking beasts, and beings of terrible beauty fill the wild spaces between the courts."
        }
      },
      {
        id: "living_realm",
        name: "Living Realm",
        description: "A plane that IS a creature \u2014 terrain is flesh, weather is breath.",
        element_type: "material",
        summary: "A plane of existence that is itself alive \u2014 its geography is anatomy",
        fields: {
          plane_type: "custom",
          is_primary_material: false,
          spatial_properties: "non_euclidean",
          stability: "fluctuating",
          time_flow_rate: "Tied to the entity's biological rhythms \u2014 time races when it is active, crawls when it sleeps",
          native_environment: "The ground pulses with warmth. Rivers carry something thicker than water. Mountains rise and fall like breathing. The sky is a membrane, and light filters through it like sunlight through skin.",
          hazards: "The entity's immune system treats visitors as infections \u2014 antibody-creatures hunt foreign life. Staying too long risks absorption into the plane's tissue. When the entity dreams, local reality warps unpredictably.",
          inhabitants: "Symbiotic cultures that maintain the entity's health in exchange for shelter. Parasitic factions exploit it. The war between symbiote and parasite is the defining conflict of the plane."
        }
      },
      {
        id: "divine_domain",
        name: "Divine Domain",
        description: "A plane shaped by and belonging to a deity. Its nature reflects the god's personality, power, and purpose.",
        element_type: "divine",
        summary: "A personal plane of a god \u2014 paradise, fortress, or cosmic throne shaped by divine will",
        detailed_notes: "A divine domain is not just a place where a god lives \u2014 it IS the god, externalized as geography. Every feature reflects the deity's nature: a war god's domain is an eternal battlefield, a harvest goddess's realm is an infinite golden field, a trickster's domain shifts and deceives. The plane responds to the god's moods \u2014 storms when angry, blooming when pleased. Mortals who enter experience the deity's personality as environmental pressure \u2014 a domain of justice makes lies physically painful, a domain of love makes hostility impossible. The domain is also the source of the god's power \u2014 damage to the domain weakens the deity, and vice versa.",
        fields: {
          plane_type: "divine",
          is_primary_material: false,
          spatial_properties: "infinite_within_bounds",
          stability: "stable",
          time_flow_rate: "At the god's discretion \u2014 a mortal visitor might experience hours while centuries pass outside, or vice versa",
          native_environment: "Perfectly reflects the deity's nature and portfolio. A sun god's domain is eternally lit, a death god's domain is shrouded in twilight. The landscape is idealized, beautiful in a way that is specific to the god's aesthetics.",
          accessibility: "By divine invitation, powerful planar magic, or death (some domains serve as afterlives for the god's faithful). Uninvited entry is possible but extremely dangerous \u2014 the domain itself acts as immune system.",
          hazards: "The domain enforces the god's will. Acting against the deity's nature causes escalating discomfort, then pain, then ejection or transformation. Staying too long without the god's favor risks being absorbed into the domain as a permanent feature.",
          inhabitants: "The god, their celestial servants, petitioner souls of dead worshippers, and any mortal visitors or prisoners the god has collected."
        }
      }
    ],
    defaultSortField: "plane_type"
  };

  // src/domains/arcane-sciences.ts
  var arcaneSciencesConfig = {
    id: "arcane_sciences",
    name: "Arcane Science",
    namePlural: "Arcane Sciences",
    icon: "cog",
    color: "#16a085",
    description: "Design the magitech devices, engineering principles, and technological infrastructure that emerge when magic and science converge. From enchanted steam engines to mana-powered communication networks, this domain covers the applied magical arts.",
    tableName: "magitech_devices",
    category: "magic",
    fields: [
      {
        name: "device_category",
        label: "Device Category",
        type: "select",
        required: true,
        options: ["weapon", "armor", "transport", "communication", "construction", "medical", "agricultural", "industrial", "domestic", "surveillance", "entertainment", "research", "infrastructure", "custom"],
        helpText: "The functional category of this magitech device or principle."
      },
      {
        name: "engineering_principle_ids",
        label: "Engineering Principles",
        type: "json",
        placeholder: '["mana_circulation_id", "rune_logic_id"]',
        helpText: "The underlying magitech engineering principles this device relies on."
      },
      {
        name: "era_id",
        label: "Era of Invention",
        type: "text",
        placeholder: "ID of the historical era when this was invented",
        helpText: "The period in which this device or principle was first developed."
      },
      {
        name: "power_source",
        label: "Power Source",
        type: "text",
        placeholder: "e.g. mana crystal, bound elemental, ambient mana, hybrid",
        helpText: "What provides energy to this device."
      },
      {
        name: "energy_type_id",
        label: "Energy Type",
        type: "text",
        placeholder: "ID of the magical energy type consumed",
        helpText: "The specific type of magical energy this device uses."
      },
      {
        name: "materials_required",
        label: "Materials Required",
        type: "json",
        placeholder: '["mithril", "dragon bone", "enchanted glass"]',
        helpText: "Key materials needed to construct this device."
      },
      {
        name: "complexity",
        label: "Complexity",
        type: "select",
        options: ["trivial", "simple", "moderate", "complex", "masterwork", "legendary"],
        helpText: "How difficult this device is to design, build, and maintain."
      },
      {
        name: "reliability",
        label: "Reliability",
        type: "select",
        options: ["experimental", "unreliable", "functional", "reliable", "robust", "flawless"],
        helpText: "How consistently this device performs under normal conditions."
      },
      {
        name: "availability",
        label: "Availability",
        type: "select",
        options: ["unique", "prototype", "rare", "limited", "common", "ubiquitous"],
        helpText: "How widely available this device is in the world."
      },
      {
        name: "cost_level",
        label: "Cost Level",
        type: "select",
        options: ["trivial", "affordable", "expensive", "luxury", "national_investment", "incalculable"],
        helpText: "The relative cost to produce or acquire this device."
      },
      {
        name: "operator_requirements",
        label: "Operator Requirements",
        type: "textarea",
        placeholder: "e.g. trained mage, any literate person, no operator needed",
        helpText: "What skills, training, or magical ability is needed to operate this device."
      },
      {
        name: "failure_modes",
        label: "Failure Modes",
        type: "textarea",
        placeholder: "What happens when it breaks or malfunctions?",
        helpText: "How this device fails and what the consequences are\u2014mana explosion, gradual decay, wild magic leak."
      },
      {
        name: "societal_impact",
        label: "Societal Impact",
        type: "textarea",
        placeholder: "How has this device changed society?",
        helpText: "The broader social, economic, or political effects of this technology."
      },
      {
        name: "predecessor_device_id",
        label: "Predecessor Device",
        type: "text",
        placeholder: "ID of the device this evolved from",
        helpText: "The earlier device or principle that this technology builds upon."
      },
      {
        name: "research_methodology",
        label: "Research Methodology",
        type: "textarea",
        placeholder: "Describe how R&D works \u2014 empirical testing, intuitive discovery, divine revelation...",
        helpText: "How this technology was developed \u2014 empirical experimentation, magical intuition, reverse-engineering, or divine inspiration."
      },
      {
        name: "safety_standards",
        label: "Safety Standards",
        type: "textarea",
        placeholder: "Describe testing requirements, certifications, known risks...",
        helpText: "Regulations, testing standards, and safety protocols governing this technology."
      }
    ],
    elementTypes: ["device", "principle", "infrastructure", "research_node", "failure", "era"],
    elementTypeDescriptions: {
      device: "A magitech tool, weapon, or apparatus \u2014 enchanted objects that merge magical and mechanical principles to achieve specific functions.",
      principle: "A fundamental law or theory of arcane engineering \u2014 the scientific understanding behind why and how magitech works.",
      infrastructure: "Large-scale magitech systems serving a society \u2014 communication networks, transportation grids, defensive wards, or power distribution.",
      research_node: "A center of arcane scientific study \u2014 laboratories, academies, or think-tanks pushing the boundaries of what magitech can do.",
      failure: "A magitech disaster or catastrophic malfunction \u2014 explosions, corruptions, or runaway enchantments that went terribly wrong.",
      era: "A period defined by a particular level or style of magitech development \u2014 from early experimentation to industrial revolution."
    },
    prompts: [
      "What was the breakthrough moment when magic and technology first merged in your world? Was it deliberate research, an accident, or a gift from another plane?",
      "How does magitech affect social inequality? Does it democratize power or concentrate it further in the hands of those who control magical resources?",
      "What are the environmental consequences of magitech industry? Does mana extraction pollute, and are there movements against it?",
      "What magitech devices exist that would be immediately recognizable analogs to real-world technology (communication, transport, medicine), and which have no real-world equivalent at all?",
      "What happens when magitech fails catastrophically? Are there historical disasters that shaped safety regulations or public fear?"
    ],
    magicPermeation: null,
    archetypes: [
      {
        id: "communication_crystal",
        name: "Communication Crystal",
        description: "A paired set of enchanted crystals that transmit voice or text over vast distances.",
        element_type: "device",
        summary: "Enchanted crystals enabling instant long-distance communication",
        fields: {
          device_category: "communication",
          power_source: "Ambient mana absorption with manual charging backup",
          complexity: "moderate",
          reliability: "reliable",
          availability: "limited",
          cost_level: "expensive",
          operator_requirements: "Minimal training required \u2014 speak clearly while touching the crystal. Tuning to a specific paired crystal requires a trained arcanist.",
          failure_modes: "Mana-dead zones cause total blackout. Interference from magical storms garbles messages. Crystals crack if overcharged.",
          societal_impact: "Revolutionized long-distance governance and trade. Military applications make them strategically vital. Commoners rarely have access."
        }
      },
      {
        id: "healing_ward",
        name: "Healing Ward",
        description: "A medical enchantment that accelerates natural healing within a defined area.",
        element_type: "device",
        summary: "A magical field that accelerates natural healing",
        fields: {
          device_category: "medical",
          power_source: "Inscribed mana-gathering rune array, requires periodic recharging",
          complexity: "complex",
          reliability: "reliable",
          availability: "rare",
          cost_level: "luxury",
          operator_requirements: "Must be installed and calibrated by a trained healer-arcanist. Ongoing use requires no special skill \u2014 patients simply rest within the ward.",
          failure_modes: "Overloaded wards can accelerate harmful growths alongside healing. Power failure during critical healing causes dangerous rebound shock.",
          societal_impact: "Hospitals and temples with healing wards attract pilgrims and the desperate. Access is a major marker of wealth and privilege."
        }
      },
      {
        id: "mana_powered_transport",
        name: "Mana-Powered Transport",
        description: "A vehicle or conveyance propelled by magical energy instead of animal or wind power.",
        element_type: "device",
        summary: "A magitech vehicle that travels without beast or wind",
        fields: {
          device_category: "transport",
          power_source: "Crystallized mana fuel cells or ley line siphoning",
          complexity: "masterwork",
          reliability: "functional",
          availability: "rare",
          cost_level: "luxury",
          operator_requirements: "Trained pilot with basic arcane sensitivity to monitor mana flow. Emergency manual controls exist but are crude.",
          failure_modes: "Mana depletion mid-transit leaves the vehicle stranded. Ley line disruptions can cause violent course deviations. Older models are prone to mana leaks.",
          societal_impact: "Wealthy merchants and nobles use these for fast overland travel. Military applications are being explored. Common folk view them with awe and suspicion."
        }
      },
      {
        id: "emotion_engine",
        name: "Emotion Engine",
        description: "A device powered by captured emotions \u2014 joy, grief, rage \u2014 condensed into fuel. Effective, efficient, and ethically nightmarish.",
        element_type: "device",
        summary: "A machine that runs on bottled feelings \u2014 the question is whose",
        fields: {
          device_category: "industrial",
          power_source: "Distilled emotional energy captured via empathic resonance chambers",
          complexity: "masterwork",
          reliability: "unreliable",
          availability: "prototype",
          cost_level: "national_investment",
          operator_requirements: "Requires an empath to calibrate and monitor emotional fuel purity. Operators report mood contamination \u2014 prolonged exposure to grief-fuel causes depression, rage-fuel causes aggression.",
          failure_modes: "Emotional resonance cascade \u2014 if the containment fails, everyone within range experiences the stored emotion at full intensity simultaneously. A grief-engine rupture once caused a city-wide depression lasting weeks.",
          societal_impact: `Banned in most civilized nations. Black market demand is enormous. Orphanages and prisons are targeted for emotion harvesting. Abolition movements call it "soul-mining." Proponents argue it's no worse than any other energy extraction.`
        }
      },
      {
        id: "golem_workforce",
        name: "Golem Workforce",
        description: "Mass-produced magical constructs used for labor, warfare, and service. Raises questions about consciousness and rights.",
        element_type: "device",
        summary: "Standardized magical constructs built for labor \u2014 cheap, tireless, and possibly aware",
        detailed_notes: "Golem workforces represent the industrialization of construct-making. Where once each golem was a unique creation of a master artificer, modern techniques allow assembly-line production using standardized animation cores and pre-inscribed command matrices. The golems handle mining, farming, construction, and warfare. They follow orders without complaint, need no food or rest, and can be repaired rather than healed. But as production scales, troubling questions arise: some golems hesitate before following orders, others develop preferences, and a few have refused commands entirely. The debate over golem consciousness \u2014 and whether these beings deserve rights \u2014 threatens to upend the economies that depend on them.",
        fields: {
          device_category: "industrial",
          power_source: "Standardized animation cores charged with crystallized mana. Each core lasts approximately one year before requiring replacement.",
          complexity: "moderate",
          reliability: "reliable",
          availability: "common",
          cost_level: "affordable",
          operator_requirements: "Basic command phrases allow anyone to direct a golem. Reprogramming, repair, and core replacement require a trained artificer. Fleet management of large workforces needs a golem-marshal with arcane training.",
          failure_modes: 'Core depletion causes gradual shutdown \u2014 the golem slows, then freezes mid-task. Command matrix corruption leads to erratic behavior or literal interpretation of orders with disastrous results. In rare cases, a golem enters "cascade awareness" and begins acting independently.',
          societal_impact: "Displaced millions of manual laborers, creating vast unemployment in lower classes. Guilds are split between those who build golems and those whose members were replaced by them. A growing abolitionist movement argues golems are enslaved minds. Counter-arguments hold that they are no more conscious than a plow."
        }
      },
      {
        id: "spell_telegraph",
        name: "Spell Telegraph Network",
        description: "A communication system using enchanted relay stations. Messages travel at the speed of magic.",
        element_type: "infrastructure",
        summary: "A continental network of enchanted relay towers enabling near-instant communication",
        detailed_notes: "The spell telegraph network consists of hundreds of relay stations, each containing a paired set of resonance crystals tuned to their neighbors. A message enters the network at one station, is encoded into a pulse of arcane energy, and hops from relay to relay until it reaches its destination. Coverage spans major cities and trade routes, though rural areas and frontier regions remain unconnected. The network has transformed governance, commerce, and warfare \u2014 generals receive battlefield reports in minutes, merchants track shipments in real time, and governments coordinate policy across vast distances. Control of the network is fiercely contested.",
        fields: {
          device_category: "communication",
          power_source: "Each relay station draws from a local mana collector array, supplemented by manually recharged crystal batteries during high-traffic periods",
          complexity: "complex",
          reliability: "reliable",
          availability: "limited",
          cost_level: "national_investment",
          operator_requirements: 'Each relay station requires a trained signal-mage to encode, decode, and route messages. Operators develop a distinctive "telegraphic shorthand" that is nearly its own language. Network maintenance requires teams of traveling artificers.',
          failure_modes: "Relay station failure creates dead zones until repaired. Magical storms can overload crystals, causing garbled messages or cascade failures across multiple stations. The network is vulnerable to sabotage \u2014 destroying a single relay in a sparse region can cut communication to entire provinces.",
          societal_impact: 'Centralized power in nations that control the network. Created a new class of signal-mage professionals. Enabled modern banking, commodity trading, and rapid military response. The "unconnected" regions resent their information disadvantage. Espionage agencies have developed methods to tap relay stations.'
        }
      },
      {
        id: "healing_vat",
        name: "Regeneration Vat",
        description: "A medical device that rebuilds tissue using magical templates. Expensive, imperfect, and ethically complex.",
        element_type: "device",
        summary: "A magitech medical pod that regrows flesh from arcane blueprints \u2014 for those who can afford it",
        detailed_notes: 'Regeneration vats use a combination of healing magic, alchemical solutions, and biological templates to rebuild damaged or missing tissue. A patient is submerged in a nutrient-rich, mana-infused solution while inscribed runes guide the regrowth process according to a pre-recorded template of their healthy body. The technology can regrow limbs, repair organs, and reverse aging to a degree. However, each treatment is enormously expensive, the process is painful and takes weeks, and imperfect templates can produce tissue that functions but feels wrong to the patient. The existence of regeneration vats raises sharp questions about medical access, the ethics of enhancement, and what constitutes a "natural" body.',
        fields: {
          device_category: "medical",
          power_source: "High-capacity mana crystal arrays providing sustained, precisely calibrated healing energy throughout the regeneration cycle",
          complexity: "masterwork",
          reliability: "functional",
          availability: "rare",
          cost_level: "luxury",
          operator_requirements: "A team of healer-arcanists and alchemists must monitor the process continuously. Template creation requires a biological mage to scan and record the patient's healthy baseline. Errors in the template produce errors in the flesh.",
          failure_modes: "Template drift causes regrown tissue that is subtly wrong \u2014 functional but alien-feeling to the patient. Power interruption during regeneration leaves tissue partially formed. In catastrophic failure, the vat produces undifferentiated tissue growth \u2014 a medical horror requiring immediate surgical intervention.",
          societal_impact: "Available only to the wealthy and powerful, creating a stark divide between those who can be rebuilt and those who suffer permanent injury. Veterans' advocacy groups demand public access. Religious orders debate whether regenerated tissue has a soul. A black market offers cut-rate treatments with dangerously imprecise templates."
        }
      },
      {
        id: "memory_crystal_archive",
        name: "Memory Crystal Archive",
        description: "A library stored in crystallized mana with complete sensory records.",
        element_type: "infrastructure",
        summary: "A vast library encoded in mana crystals \u2014 each record contains not just text but full sensory experience",
        detailed_notes: "Memory crystal archives represent the pinnacle of magical information storage. Instead of writing on paper or parchment, knowledge is recorded directly into crystallized mana as complete sensory experiences. A reader doesn't just learn about a historical battle \u2014 they experience it, feeling the ground shake, hearing the war cries, smelling the smoke. The technology was developed by archivist-mages frustrated with the limitations of written language, and it has transformed scholarship, education, and legal testimony. A single crystal the size of a fist can hold a lifetime of experiences. Major archives contain millions of crystals, organized by sophisticated indexing systems. The technology raises profound questions about privacy, intellectual property, and the nature of knowledge \u2014 experiencing someone's memories is far more intimate than reading their words.",
        fields: {
          device_category: "infrastructure",
          power_source: "Self-sustaining mana lattice within each crystal. Archive-wide search and indexing systems draw from a central mana reservoir.",
          complexity: "masterwork",
          reliability: "reliable",
          availability: "rare",
          cost_level: "national_investment",
          operator_requirements: "Recording requires a trained memory-crystallographer who can extract and encode sensory experiences without distortion. Reading requires only physical contact with the crystal and basic mana sensitivity. Indexing and archive management require specialized training.",
          failure_modes: "Crystal degradation over centuries causes memory corruption \u2014 sensory details fade, emotions flatten, or experiences blend together. Physical damage shatters the crystal and destroys its contents irretrievably. Mana surges can overwrite crystals with ambient impressions.",
          societal_impact: "Transformed legal proceedings \u2014 eyewitness testimony is now recorded and replayed directly. Education uses experiential learning. Historical research provides first-person perspectives on ancient events. Privacy advocates warn of a surveillance state where every experience can be crystallized and reviewed."
        }
      },
      {
        id: "weather_engine",
        name: "Weather Engine",
        description: "Magitech that controls regional weather. Agricultural revolution or weapon.",
        element_type: "infrastructure",
        summary: "A massive magitech installation that controls weather across an entire region \u2014 harvest-bringer or weapon of war",
        detailed_notes: "Weather engines are enormous magitech installations capable of controlling precipitation, temperature, wind patterns, and storm activity across a region spanning hundreds of square kilometers. Developed initially to stabilize agriculture \u2014 ensuring reliable rainfall, preventing frost, and dissipating destructive storms \u2014 the technology quickly found military and political applications. A civilization with a weather engine can starve its enemies through drought, shatter armies with directed lightning storms, or simply make its own farmland the most productive in the world. The devices are monumentally expensive, requiring rare materials, continuous mana supply, and teams of specialized operators. They also have ecological consequences: forcing weather patterns in one region disrupts natural patterns in neighboring regions, creating a cascading arms race where every nation needs its own weather engine to counter its neighbors'.",
        fields: {
          device_category: "infrastructure",
          power_source: "Massive ley line tap supplemented by banks of high-capacity mana crystals. Peak operations during storm-calling consume enormous energy.",
          complexity: "legendary",
          reliability: "functional",
          availability: "unique",
          cost_level: "national_investment",
          operator_requirements: "A team of weather-mages, atmospheric scholars, and magitech engineers operating in shifts. The lead operator must have innate weather sensitivity and decades of meteorological experience. Miscalibration can trigger uncontrolled storms.",
          failure_modes: "Catastrophic failure releases stored atmospheric energy as a massive uncontrolled storm \u2014 hurricanes, lightning barrages, or flash-freezing events. Partial failures create bizarre localized weather anomalies that persist until manually corrected. Sustained operation without maintenance degrades the ley line tap, risking mana depletion in the surrounding region.",
          societal_impact: "Agricultural revolution in regions with weather engines \u2014 famine becomes almost unknown. Military applications make weather engines strategic targets and deterrents. Neighboring regions suffer weather disruption, creating diplomatic crises. Environmental movements protest the ecological damage of forced weather patterns."
        }
      },
      {
        id: "portal_network",
        name: "Portal Network",
        description: "Transportation system of linked magical gateways.",
        element_type: "infrastructure",
        summary: "A continental transportation network of linked magical gateways enabling instant travel between distant locations",
        detailed_notes: `The portal network is a system of permanently maintained magical gateways that allow instant transportation between connected nodes. Each portal is a stabilized rift anchored by massive runestone arrays and powered by local mana sources. Travelers step through a shimmering gateway in one city and emerge from a corresponding gateway hundreds or thousands of kilometers away. The network has transformed trade, warfare, governance, and daily life in connected regions. However, it is expensive to build and maintain, limiting coverage to major cities and strategic locations. Rural areas remain isolated, creating a sharp divide between the portal-connected world and the "walk-bound" communities beyond the network's reach. Security is a constant concern \u2014 a compromised portal could allow an invading army to appear in the heart of a capital city.`,
        fields: {
          device_category: "transport",
          power_source: "Each portal node draws from a dedicated ley line tap or large mana crystal array. Transit energy scales with distance and cargo mass.",
          complexity: "legendary",
          reliability: "reliable",
          availability: "limited",
          cost_level: "national_investment",
          operator_requirements: "Each portal station requires a team of portal-mages to maintain stabilization, manage traffic flow, and perform security screening. Emergency shutdown requires a senior portal-mage with override authority. Travelers need no special ability \u2014 they simply walk through.",
          failure_modes: "Portal destabilization can scatter travelers across random locations or partially transport them (a horrifying outcome). Power failure strands travelers mid-transit in an inter-spatial void. Security breaches allow unauthorized access. Rare cascade failures can collapse multiple linked portals simultaneously.",
          societal_impact: "Unified distant territories under single governance. Enabled rapid military deployment and response. Created a new class of portal-connected elite. Rural communities resent their exclusion. Smuggling through corrupted portal operators is a constant law enforcement challenge. The network's controller wields enormous geopolitical influence."
        }
      }
    ],
    defaultSortField: "device_category"
  };

  // src/domains/magic-ecology.ts
  var magicEcologyConfig = {
    id: "magic_ecology",
    name: "Magic Ecology",
    namePlural: "Magic Ecology",
    icon: "sprout",
    color: "#2ecc71",
    description: "Explore how magic functions as a natural force within ecosystems. Define mana cycles, magical mutations, enchanted food webs, and environments saturated with arcane energy. Magic ecology treats mana as a resource that flows, pools, and transforms just like water or sunlight.",
    tableName: "mana_cycles",
    category: "magic",
    fields: [
      {
        name: "energy_type_id",
        label: "Energy Type",
        type: "text",
        placeholder: "ID of the magical energy type involved in this cycle",
        helpText: "The specific type of magical energy that flows through this cycle."
      },
      {
        name: "stages",
        label: "Cycle Stages",
        type: "json",
        required: true,
        placeholder: '["generation", "dispersal", "absorption", "transformation", "release"]',
        helpText: "The ordered stages through which mana flows in this ecological cycle."
      },
      {
        name: "cycle_duration",
        label: "Cycle Duration",
        type: "text",
        placeholder: "e.g. 28 days (lunar), 1 year, centuries, irregular",
        helpText: "How long one complete cycle takes from start to finish."
      },
      {
        name: "geographic_scope",
        label: "Geographic Scope",
        type: "select",
        options: ["local", "regional", "continental", "global", "planar", "cosmic"],
        helpText: "The spatial scale at which this cycle operates."
      },
      {
        name: "key_organisms",
        label: "Key Organisms",
        type: "textarea",
        placeholder: "Species that play critical roles in this mana cycle...",
        helpText: "Flora, fauna, or other organisms that are essential participants in this cycle."
      },
      {
        name: "key_geological_features",
        label: "Key Geological Features",
        type: "textarea",
        placeholder: "Ley line nodes, mana springs, crystal formations...",
        helpText: "Geographic or geological features that anchor or channel this cycle."
      },
      {
        name: "disruption_risks",
        label: "Disruption Risks",
        type: "textarea",
        placeholder: "What could break this cycle? Over-harvesting, pollution, planar shifts...",
        helpText: "Threats that could disrupt, weaken, or destroy this mana cycle."
      },
      {
        name: "historical_disruptions",
        label: "Historical Disruptions",
        type: "textarea",
        placeholder: "Past events that disrupted this cycle and their consequences...",
        helpText: "Known historical instances where this cycle was disrupted and what resulted."
      },
      {
        name: "mana_pollution",
        label: "Mana Pollution",
        type: "textarea",
        placeholder: "Describe magical waste, contamination, toxic mana buildup...",
        helpText: "How magical waste, byproducts, or contamination affects this cycle and the surrounding environment."
      },
      {
        name: "dead_zones",
        label: "Dead Zones",
        type: "textarea",
        placeholder: "Describe mana-barren areas, causes, and effects on life...",
        helpText: "Areas where mana has been depleted or blocked \u2014 their causes, boundaries, and impact on magical and mundane life."
      }
    ],
    elementTypes: ["mana_cycle", "mutation", "magical_food_web", "saturated_environment"],
    elementTypeDescriptions: {
      mana_cycle: "The path mana follows through an ecosystem \u2014 how it's generated, consumed, recycled, and lost. The magical equivalent of a water or carbon cycle.",
      mutation: "A magical alteration to a living organism \u2014 new abilities, changed anatomy, or corrupted biology caused by mana exposure.",
      magical_food_web: "The network of mana transfer between organisms \u2014 who produces, consumes, and concentrates magical energy in an ecosystem.",
      saturated_environment: "A region so infused with mana that the environment itself behaves magically \u2014 glowing soil, living weather, or reality distortions."
    },
    prompts: [
      "How does mana flow through your world's ecosystems? Is it more like water (following gravity and channels) or like sunlight (radiating from sources)?",
      "What happens to an ecosystem when its mana cycle is disrupted? Do creatures mutate, die off, or adapt in unexpected ways?",
      "Are there keystone species in the magical ecosystem\u2014organisms whose removal would cause cascading mana collapse?",
      "How do mana-saturated environments differ from normal ones? Are there magical equivalents of rainforests, deserts, or deep-sea vents?",
      "Can new mana cycles emerge naturally, or are they all ancient? Has civilization ever accidentally created one through magical pollution or infrastructure?"
    ],
    magicPermeation: null,
    archetypes: [
      {
        id: "atmospheric_mana_cycle",
        name: "Atmospheric Mana Cycle",
        description: "Mana evaporates, condenses in the upper atmosphere, and precipitates back as mana rain or dew.",
        element_type: "mana_cycle",
        summary: "A global cycle where mana rises, condenses, and rains back to the surface",
        fields: {
          cycle_duration: "Seasonal \u2014 peaks during equinoxes, ebbs at solstices",
          geographic_scope: "global",
          key_organisms: "Mana-absorbing canopy trees draw ambient mana and release it through transpiration. High-altitude mana plankton seed condensation.",
          key_geological_features: "Mountain ranges force mana-laden air upward, creating mana rain shadows. Ley line intersections act as mana springs.",
          disruption_risks: "Deforestation breaks the transpiration cycle. Large-scale magical warfare can punch holes in the mana layer. Industrial mana extraction depletes ground reserves."
        }
      },
      {
        id: "geological_mana_cycle",
        name: "Geological Mana Cycle",
        description: "Mana wells up from deep within the earth through volcanic and tectonic processes.",
        element_type: "mana_cycle",
        summary: "Mana rising from the planet's depths through faults and volcanic vents",
        fields: {
          cycle_duration: "Geological \u2014 major pulses every few centuries, minor seepage continuous",
          geographic_scope: "continental",
          key_organisms: "Deep-root fungi network that transports mana from geological seeps to surface ecosystems. Mana worms that burrow along ley lines.",
          key_geological_features: "Volcanic vents and hot springs as primary mana sources. Ley lines follow tectonic fault systems. Crystal caverns act as natural mana reservoirs.",
          disruption_risks: "Over-mining of mana crystals depletes reservoirs. Tectonic shifts can redirect or seal ley lines. Volcanic eruptions release catastrophic mana surges."
        }
      },
      {
        id: "biological_mana_cycle",
        name: "Biological Mana Cycle",
        description: "Living organisms generate, store, and release mana through their life processes.",
        element_type: "mana_cycle",
        summary: "A living web where mana flows through food chains and decomposition",
        fields: {
          cycle_duration: "Continuous, with generational accumulation",
          geographic_scope: "regional",
          key_organisms: "All living things participate \u2014 plants absorb ambient mana during growth, animals concentrate it through diet, decomposers release it back to the soil. Apex magical predators are the most mana-dense.",
          key_geological_features: "Ancient burial grounds and fossil beds are mana-rich. Old-growth forests accumulate mana over centuries. Mass extinction sites create mana dead zones.",
          disruption_risks: "Extinction of keystone magical species collapses the local mana web. Necromantic practices trap mana in undeath, removing it from the cycle. Overhunting magical fauna depletes concentrated reserves."
        }
      },
      {
        id: "necrotic_mana_cycle",
        name: "Necrotic Mana Cycle",
        description: "A mana cycle fueled by death itself \u2014 where dying releases more magical energy than living, creating perverse ecological incentives.",
        element_type: "mana_cycle",
        summary: "A dark cycle where death generates more mana than life, with disturbing consequences",
        fields: {
          cycle_duration: "Continuous, with spikes during mass death events",
          geographic_scope: "regional",
          key_organisms: "Scavengers and decomposers are the primary mana producers \u2014 the more death they process, the more mana enters the system. Predators have evolved to kill more than they eat, wasting flesh but harvesting mana. Plants in these regions are carnivorous by default.",
          key_geological_features: "Ancient battlefields and plague pits are permanent mana hotspots. Bone-rich soil layers act as slow-release mana sources. Graveyards in these regions must be warded or they spontaneously generate undead.",
          disruption_risks: "Peace is ecologically destabilizing \u2014 extended periods without death cause mana famines. Civilizations in these regions face a horrifying incentive structure around warfare and sacrifice.",
          mana_pollution: "Excess necrotic mana causes spontaneous undeath, ghostly manifestations, and a general miasma of despair. Long-term residents develop a tolerance that outsiders find deeply unsettling."
        }
      },
      {
        id: "mana_desert",
        name: "Mana Dead Zone",
        description: "A region completely drained of magical energy. No spells work, enchantments fail, magical creatures sicken and die.",
        element_type: "saturated_environment",
        summary: "A barren region where all magic has been stripped away, leaving a void",
        detailed_notes: "Mana dead zones are ecological wastelands from a magical perspective. They form when mana is catastrophically over-extracted, drained by a magical disaster, or deliberately purged. Within the zone, no spell functions, no enchantment holds, and no magical creature can survive for long. Mundane life persists \u2014 ordinary plants and animals thrive in the absence of magical competition \u2014 but the boundary between the dead zone and the living magical world is sharp and dangerous. Creatures that depend on mana weaken as they approach and die if they cross in. For non-magical communities, dead zones offer a strange sanctuary from magical threats, but at the cost of total isolation from magical infrastructure.",
        fields: {
          cycle_duration: "Persistent \u2014 dead zones can last centuries or millennia once established",
          geographic_scope: "regional",
          key_organisms: "Mundane species dominate. Non-magical variants of normally magical creatures evolve within the zone. Mana-dependent species die at the boundary. A unique border ecology develops at the edge where mana concentration drops to zero.",
          key_geological_features: "The zone often centers on a site of magical catastrophe \u2014 a crater, a collapsed ley line nexus, or a drained mana reservoir. The boundaries are visible as a sharp transition where magical flora abruptly gives way to mundane vegetation.",
          disruption_risks: "Dead zones can expand if the surrounding mana cycle weakens, or contract if mana pressure from healthy regions pushes inward. Artificial re-introduction of mana is possible but expensive and unstable \u2014 the zone tends to drain introduced mana rapidly.",
          dead_zones: "The zone itself is the dead zone. Ambient mana reads at absolute zero. Mana detection instruments fail or read negative values at the deepest points. Even latent magical ability in living beings is suppressed.",
          historical_disruptions: "Most dead zones trace their origin to a specific catastrophic event \u2014 a great battle, a failed ritual of enormous scale, or deliberate mana-scorching as a weapon of war."
        }
      },
      {
        id: "ley_line_nexus",
        name: "Ley Line Nexus",
        description: "A point where multiple ley lines intersect. Enormous magical power, enormous instability, and a magnet for settlements and disasters.",
        element_type: "mana_cycle",
        summary: "A convergence point of multiple ley lines radiating immense and volatile magical energy",
        detailed_notes: "Ley line nexuses are the most powerful natural concentrations of magical energy in the world. Where two or more ley lines cross, their combined flow creates a vortex of mana that saturates the surrounding area. The effects are dramatic: magic is amplified, spells are more powerful, and the ambient mana can be tapped for enormous projects. But nexuses are also dangerously unstable. Mana surges, wild magic eruptions, and spontaneous planar thinning are constant risks. Despite this, civilizations have always been drawn to nexuses \u2014 the power is simply too valuable to ignore. The greatest cities, temples, and academies are built on nexus points, and wars have been fought over their control.",
        fields: {
          cycle_duration: "Continuous, with tidal fluctuations tied to celestial and seasonal cycles",
          geographic_scope: "local",
          key_organisms: "Mana-gorged flora and fauna of exaggerated size and magical potency. Trees that glow, animals with innate spellcasting, and apex predators that feed on pure mana. Mutations are common and often beneficial near a nexus.",
          key_geological_features: "The nexus itself is often marked by a natural formation \u2014 a standing stone circle, a crystalline outcrop, or a perpetually flowing spring of luminous water. Ley lines are visible to mana-sensitive individuals as glowing rivers of energy converging on the point.",
          disruption_risks: "Ley line diversion \u2014 natural or artificial \u2014 can starve a nexus, collapsing the ecosystems and civilizations built around it. Over-tapping the nexus for industrial or military use can cause a mana blowout, releasing centuries of accumulated energy in a single catastrophic event.",
          mana_pollution: "Excess mana at a nexus can cause wild magic zones, spontaneous enchantments, and reality distortions. Long-term residents may develop magical sensitivity, unusual abilities, or physical mutations."
        }
      },
      {
        id: "magical_apex_predator",
        name: "Mana Apex Predator",
        description: "A creature at the top of the magical food chain. Absorbs ambient mana and drains it from other creatures.",
        element_type: "magical_food_web",
        summary: "A dominant creature that feeds on magical energy itself, reshaping the ecosystem around it",
        detailed_notes: `Mana apex predators are the keystone species of magical ecosystems. These creatures have evolved to feed not on flesh but on magical energy \u2014 absorbing ambient mana from the environment and draining it directly from other magical beings. Their presence creates a "mana shadow" \u2014 a region of reduced magical energy in their territory where lesser magical creatures are weakened and mundane species gain a competitive advantage. The predator's movements create a dynamic, shifting landscape of mana-rich and mana-poor zones. When a mana apex predator dies, the ecological consequences are enormous: mana floods back into the territory, triggering explosive magical growth, mutation cascades, and the emergence of new magical species to fill the void.`,
        fields: {
          cycle_duration: "Tied to the predator's life cycle \u2014 territorial feeding patterns create seasonal mana fluctuations",
          geographic_scope: "regional",
          key_organisms: "The predator itself is the keystone. Symbiotic species ride in its mana shadow, thriving in low-mana conditions. Parasitic species attempt to siphon mana from the predator. Prey species develop mana-concealment adaptations to avoid detection.",
          key_geological_features: "The predator's lair is typically a mana-depleted zone surrounded by rings of increasing mana density. Migration paths are visible as corridors of reduced mana. Nesting sites become permanent low-mana landmarks.",
          disruption_risks: "Killing or driving off the apex predator causes mana flooding \u2014 an ecological catastrophe where unchecked magical energy triggers runaway mutations, spontaneous enchantments, and the emergence of dangerous new species. Conversely, the introduction of a second apex predator creates territorial conflict that destabilizes entire regions.",
          historical_disruptions: "The extinction of a mana apex predator in the Third Age is credited with the creation of the Shimmerwood \u2014 a hyper-magical forest that grew from ordinary woodland in a single decade after the predator's death."
        }
      },
      {
        id: "mana_bloom",
        name: "Mana Bloom",
        description: "Periodic explosion of magical energy where flora/fauna go wild, mutations spike.",
        element_type: "mana_cycle",
        summary: "A periodic eruption of magical energy that drives explosive growth, mutation, and ecological chaos",
        detailed_notes: "Mana blooms are cyclical events where ambient magical energy spikes dramatically over a region, triggering explosive biological and magical responses. During a bloom, plants grow at hundreds of times their normal rate, animals undergo rapid mutation, dormant magical abilities activate spontaneously, and the boundary between the material plane and adjacent realities thins dangerously. Blooms last days to weeks and leave the affected region permanently altered \u2014 forests grow in hours, new species emerge, and the landscape is transformed. Civilizations near bloom-prone areas have adapted: some harvest the surge for industrial and agricultural purposes, while others evacuate until the chaos subsides. Predicting blooms is an imprecise science, and unexpected blooms in populated areas are among the most feared natural magical disasters.",
        fields: {
          cycle_duration: "Irregular \u2014 typically every 7-15 years, with minor blooms between major events. Duration of each bloom: 3-21 days.",
          geographic_scope: "regional",
          key_organisms: "Bloom-adapted flora that remains dormant between events, exploding into growth during surges. Bloom-predators that migrate to affected areas to feed on the sudden abundance. Mana-sponge organisms that absorb excess energy and stabilize the environment post-bloom.",
          key_geological_features: "Bloom epicenters are typically ley line nodes or sites of ancient magical events. The affected radius follows ley line paths outward from the epicenter. Post-bloom terrain features include mana-crystal formations, mutated rock structures, and permanently enchanted soil.",
          disruption_risks: "Artificial mana extraction can suppress blooms, causing dangerous buildup that eventually releases as a catastrophic super-bloom. Ecological damage to bloom-adapted species disrupts the cycle's self-regulation, making blooms more intense and unpredictable."
        }
      },
      {
        id: "dead_magic_adaptation",
        name: "Dead Magic Adaptation",
        description: "Organisms evolved to survive in mana-depleted zones.",
        element_type: "mutation",
        summary: "Creatures that have evolved to thrive where magic cannot reach \u2014 the anti-magical ecosystem",
        detailed_notes: "Dead magic adaptation is the suite of biological mutations that allow organisms to survive and even thrive in mana-depleted zones. Where magical ecosystems collapse, these adapted species fill the void. They are mana-null \u2014 not only surviving without magic but actively resisting it. Their tissues absorb and neutralize ambient mana, their metabolisms run on purely chemical energy, and some have evolved the ability to drain magical energy from their environment or from magical creatures that wander into their territory. This makes them ecologically dominant within dead zones and dangerous to magical beings at the boundaries. Some civilizations have weaponized dead-magic organisms, deploying mana-draining creatures against magical enemies or cultivating anti-magical materials for ward-breaking.",
        fields: {
          cycle_duration: "Evolutionary \u2014 adaptations develop over generations, with rapid mutation in newly formed dead zones",
          geographic_scope: "local",
          key_organisms: "Null-moss \u2014 a mana-absorbing plant that carpets dead zone floors. Void beetles \u2014 insects whose carapaces nullify magic on contact. Silence wolves \u2014 predators that hunt by draining the mana from magical prey, leaving them weakened. Pale trees \u2014 enormous albino trees that thrive without magical photosynthesis.",
          key_geological_features: "Dead zone boundaries where adapted and non-adapted ecosystems compete. Mana-sink formations \u2014 geological features that actively drain ambient magic. Null-crystal deposits \u2014 anti-magical mineral formations unique to dead zones.",
          disruption_risks: "Re-introduction of mana to a dead zone can devastate adapted organisms. Conversely, dead-magic adapted species escaping their zone can disrupt magical ecosystems by draining ambient mana from healthy environments."
        }
      },
      {
        id: "magical_symbiosis",
        name: "Magical Symbiosis",
        description: "Two species sharing mana: one generates, one shapes, both benefit.",
        element_type: "magical_food_web",
        summary: "A symbiotic relationship where two species share magical energy \u2014 one produces mana, the other shapes it",
        detailed_notes: "Magical symbiosis occurs when two species evolve a complementary relationship around mana production and manipulation. One species \u2014 the generator \u2014 produces mana through biological processes but lacks the ability to use it, while the other \u2014 the shaper \u2014 can manipulate mana but cannot produce its own. Together, they form a unit more powerful than either alone. The most famous example involves mana-producing coral that provides raw energy to the intelligent cephalopods living within it \u2014 the cephalopods shape the mana into defensive barriers, growth-promoting fields, and communication networks that benefit both species. These symbioses are ecological keystones: disrupting the relationship crashes local mana cycles and can trigger cascading ecosystem failures. Some sentient species have entered into similar arrangements with non-sentient mana generators, raising questions about whether the relationship is symbiosis or domestication.",
        fields: {
          cycle_duration: "Continuous \u2014 the symbiotic exchange operates constantly, with daily and seasonal fluctuations in mana production and shaping",
          geographic_scope: "local",
          key_organisms: "Mana generators \u2014 organisms that produce magical energy as a metabolic byproduct (bioluminescent fungi, mana-coral, ley-root trees). Mana shapers \u2014 organisms that can manipulate ambient mana but cannot generate their own (certain intelligent species, spell-weaving spiders, ward-singing birds). Parasitic third parties that attempt to siphon mana from the symbiotic pair.",
          key_geological_features: "Symbiotic zones are identifiable by their unusual ecological stability \u2014 mana levels are consistent, growth is balanced, and wild magic events are rare. The shaped mana often creates visible environmental effects: glowing forests, perpetually calm waters, or temperature-regulated microclimates.",
          disruption_risks: "Removing either symbiotic partner collapses the relationship \u2014 generators flood the area with uncontrolled mana, while shapers starve and die. Pollution, habitat destruction, or poaching of either species threatens the entire local ecosystem."
        }
      },
      {
        id: "biological_mana",
        name: "Biological Mana Cycle",
        description: "Mana generated, stored, and released by living organisms.",
        element_type: "mana_cycle",
        summary: "A mana cycle driven by the metabolic processes of living things",
        fields: {
          cycle_duration: "Continuous, with generational accumulation and seasonal peaks",
          geographic_scope: "regional",
          key_organisms: "All living things participate \u2014 mana-photosynthetic plants absorb ambient energy, herbivores concentrate it, predators accumulate it further. Decomposers release stored mana back into the soil and atmosphere.",
          key_geological_features: "Old-growth ecosystems are the richest mana reservoirs. Ancient burial grounds and fossil beds hold concentrated reserves. Mass extinction sites become mana wastelands.",
          disruption_risks: "Extinction of keystone magical species collapses the local mana web. Necromancy traps mana in undeath, removing it from circulation. Overhunting magical fauna depletes the cycle's upper tiers."
        }
      },
      {
        id: "geological_mana",
        name: "Geological Mana Cycle",
        description: "Mana that wells up from deep within the earth through volcanic and tectonic processes.",
        element_type: "mana_cycle",
        summary: "Deep-earth mana rising through faults and vents on geological timescales",
        fields: {
          cycle_duration: "Geological \u2014 major pulses every few centuries, minor seepage continuous",
          geographic_scope: "continental",
          key_organisms: "Deep-root fungi networks transport mana from geological seeps to surface ecosystems. Lithovore organisms feed on mana-saturated minerals in deep caves.",
          key_geological_features: "Volcanic vents and hot springs as primary emission points. Ley lines follow tectonic fault systems. Crystal caverns serve as natural mana reservoirs that fill and drain over centuries.",
          disruption_risks: "Over-mining mana crystals depletes reservoirs faster than geology can replenish them. Tectonic shifts can redirect or seal ley lines permanently. Volcanic eruptions release catastrophic mana surges that devastate surface ecosystems."
        }
      }
    ],
    defaultSortField: "cycle_duration"
  };

  // src/domains/magic-economy.ts
  var magicEconomyConfig = {
    id: "magic_economy",
    name: "Magic Economy",
    namePlural: "Magic Economy",
    icon: "coins",
    color: "#f1c40f",
    description: "Define the economic dimensions of magic in your world. From mana resources and their extraction to magical trade goods, enchanter guilds, regulatory frameworks, and black markets\u2014this domain covers how magic creates, distributes, and concentrates wealth and power.",
    tableName: "mana_resources",
    category: "magic",
    fields: [
      {
        name: "resource_type",
        label: "Resource Type",
        type: "select",
        required: true,
        options: ["crystallized_mana", "liquid_mana", "ambient_field", "biological", "geological", "planar_bleed", "refined_product", "byproduct", "custom"],
        helpText: "The fundamental form of this magical resource."
      },
      {
        name: "source_id",
        label: "Source",
        type: "text",
        placeholder: "ID of the magic source that produces this resource",
        helpText: "The magical source from which this resource originates."
      },
      {
        name: "energy_type_id",
        label: "Energy Type",
        type: "text",
        placeholder: "ID of the magical energy type",
        helpText: "The type of magical energy this resource contains or produces."
      },
      {
        name: "extraction_method",
        label: "Extraction Method",
        type: "textarea",
        placeholder: "How is this resource gathered or harvested?",
        helpText: "The techniques and tools used to extract or collect this resource."
      },
      {
        name: "refinement_process",
        label: "Refinement Process",
        type: "textarea",
        placeholder: "How is the raw resource processed into usable form?",
        helpText: "Steps to refine raw magical material into a form suitable for use."
      },
      {
        name: "quality_grades",
        label: "Quality Grades",
        type: "json",
        placeholder: '["crude", "refined", "pure", "transcendent"]',
        helpText: "The quality tiers this resource is graded into."
      },
      {
        name: "geographic_distribution",
        label: "Geographic Distribution",
        type: "textarea",
        placeholder: "Where in the world is this resource found?",
        helpText: "The regions, biomes, or conditions where this resource naturally occurs."
      },
      {
        name: "total_estimated_reserves",
        label: "Total Estimated Reserves",
        type: "text",
        placeholder: "e.g. vast, declining, nearly exhausted, unknown",
        helpText: "The estimated total remaining supply of this resource."
      },
      {
        name: "renewability",
        label: "Renewability",
        type: "select",
        options: ["non_renewable", "slowly_renewable", "renewable", "rapidly_renewable", "infinite", "unknown"],
        helpText: "Whether and how quickly this resource replenishes naturally."
      },
      {
        name: "depletion_rate",
        label: "Depletion Rate",
        type: "text",
        placeholder: "e.g. sustainable, accelerating, critical",
        helpText: "How quickly current consumption is outpacing natural replenishment."
      },
      {
        name: "environmental_impact_of_extraction",
        label: "Environmental Impact",
        type: "textarea",
        placeholder: "What damage does extraction cause to the surrounding environment?",
        helpText: "Ecological consequences of harvesting this resource\u2014mana dead zones, mutations, planar thinning."
      },
      {
        name: "controlling_entities",
        label: "Controlling Entities",
        type: "textarea",
        placeholder: "Which civilizations, guilds, or factions control this resource?",
        helpText: "The political and economic powers that control access to this resource."
      },
      {
        name: "strategic_importance",
        label: "Strategic Importance",
        type: "select",
        options: ["negligible", "minor", "moderate", "major", "critical", "existential"],
        helpText: "How important this resource is to geopolitical power and military capability."
      },
      {
        name: "market_structure",
        label: "Market Structure",
        type: "select",
        options: ["monopoly", "oligopoly", "guild_controlled", "free_market", "state_run", "barter", "auction", "mixed"],
        helpText: "How the market for this resource is organized and controlled."
      },
      {
        name: "black_market_details",
        label: "Black Market Details",
        type: "textarea",
        placeholder: "Describe illicit trade, smuggling routes, penalties...",
        helpText: "How this resource is traded illegally \u2014 smuggling networks, penalties for possession, price premiums."
      }
    ],
    elementTypes: ["resource", "trade_good", "profession", "regulation", "black_market"],
    elementTypeDescriptions: {
      resource: "A raw magical material that can be extracted, harvested, or mined \u2014 mana crystals, ley line energy, enchanted ore, or ambient magic.",
      trade_good: "A finished or processed magical product bought and sold \u2014 enchanted items, potions, spell scrolls, or magical services.",
      profession: "A magical occupation or career \u2014 enchanters, alchemists, ward-smiths, mana harvesters, or any job that requires magical skill.",
      regulation: "A law, treaty, or institutional rule governing magic \u2014 licensing requirements, banned spells, trade restrictions, or safety standards.",
      black_market: "Illegal magical trade \u2014 forbidden spells, stolen artifacts, unlicensed enchantments, or substances banned by magical authorities."
    },
    prompts: [
      "What is the most valuable magical resource in your world, and who controls it? Has this control ever been the cause of wars?",
      "How do magical professions fit into the broader economy? Is an enchanter more like an artisan, an engineer, or a doctor in social and economic standing?",
      "What magical goods and services are available to ordinary people versus only the wealthy? Is there a magical middle class?",
      "What does the black market for magic look like? What is sold illegally, and why is it forbidden?",
      "Are magical resources being depleted? Is there a conservation movement, and do powerful interests resist it?"
    ],
    magicPermeation: null,
    archetypes: [
      {
        id: "crystallized_mana_resource",
        name: "Crystallized Mana",
        description: "Solid mana crystals mined from deep deposits \u2014 the gold standard of magical currency.",
        element_type: "resource",
        summary: "Precious mana crystals mined from deep beneath ley lines",
        fields: {
          resource_type: "crystallized_mana",
          extraction_method: "Deep mining operations in ley line convergence points. Crystals grow in geological timescales and must be carefully extracted to avoid shattering and mana release.",
          refinement_process: "Raw crystals are cut, polished, and graded by certified mana-smiths. Impurities are burned off in controlled arcane furnaces.",
          geographic_distribution: "Concentrated near tectonic fault lines and ancient ley line nexuses. Some surface deposits exist in magically saturated regions.",
          renewability: "slowly_renewable",
          strategic_importance: "critical",
          market_structure: "guild_controlled"
        }
      },
      {
        id: "ambient_mana_field",
        name: "Ambient Mana Field",
        description: "A region of naturally elevated background mana that can be harvested or tapped.",
        element_type: "resource",
        summary: "Naturally occurring magical energy harvested from the environment",
        fields: {
          resource_type: "ambient_field",
          extraction_method: "Mana collectors \u2014 tower-mounted arrays of resonant crystals that draw in and concentrate ambient magical energy from the surrounding area.",
          refinement_process: "Collected ambient mana is compressed and stored in capacitor crystals. Low-grade but consistent output.",
          geographic_distribution: "Strongest near ley line intersections, old-growth magical forests, and sites of historical magical events. Weakest in urban areas and mana-dead zones.",
          renewability: "renewable",
          strategic_importance: "major",
          market_structure: "mixed"
        }
      },
      {
        id: "biological_magic_source",
        name: "Biological Magic Source",
        description: "Magical materials harvested from living or recently living organisms.",
        element_type: "resource",
        summary: "Magical reagents and materials harvested from enchanted creatures and plants",
        fields: {
          resource_type: "biological",
          extraction_method: "Harvesting from magical creatures (scales, blood, heartstone), cultivating magical plants, or collecting natural magical secretions like phoenix tears or unicorn hair.",
          refinement_process: "Biological materials are preserved through alchemical processes, then ground, distilled, or infused depending on the intended use.",
          geographic_distribution: "Wherever magical flora and fauna thrive \u2014 primarily old-growth magical forests, deep oceans, and planar border regions.",
          renewability: "renewable",
          strategic_importance: "moderate",
          market_structure: "free_market",
          environmental_impact_of_extraction: "Overharvesting threatens magical species. Poaching of rare creatures is a major conservation and law enforcement challenge."
        }
      },
      {
        id: "stolen_futures",
        name: "Temporal Mana Futures",
        description: "Mana borrowed from the future \u2014 spend it now, but somewhere down the timeline, someone pays the debt with interest.",
        element_type: "trade_good",
        summary: "Magical energy extracted from future timelines \u2014 powerful now, catastrophic later",
        fields: {
          resource_type: "custom",
          extraction_method: "Temporal siphoning rituals draw mana from potential futures. The process is simple \u2014 worryingly so \u2014 and the mana is high-purity. The problem is that every unit borrowed creates a mana-debt that compounds across time.",
          refinement_process: "None needed \u2014 temporal mana arrives pre-refined. This is part of what makes it so dangerous and attractive.",
          geographic_distribution: "Can be extracted anywhere with a trained temporal mage. Concentration is highest near temporal anomalies, thin spots in the timestream, and sites of prophecy.",
          renewability: "unknown",
          strategic_importance: "existential",
          market_structure: "auction",
          environmental_impact_of_extraction: 'Localized temporal instability \u2014 clocks run backward, people experience d\xE9j\xE0 vu, cause and effect occasionally reverse. Heavy extraction creates temporal dead zones where the future has been "spent" and nothing new can happen.',
          controlling_entities: "Officially banned by every major civilization. In practice, a shadow network of temporal brokers operates across borders. Some governments are secretly the largest buyers."
        }
      },
      {
        id: "enchanter_guild",
        name: "Enchanter's Guild",
        description: "A powerful professional guild that monopolizes enchantment services. Controls quality, pricing, and who can practice.",
        element_type: "profession",
        summary: "A monopolistic guild controlling who may enchant, what they charge, and how good it has to be",
        detailed_notes: "The Enchanter's Guild emerged from centuries of unregulated enchantment \u2014 a period marked by fraudulent enchantments, dangerous failures, and price-gouging. The guild standardized training, established quality grades, and created a licensing system that effectively bars unlicensed enchanters from legal practice. Guild members benefit from collective bargaining, shared research, and legal protection. Critics argue the guild has become a monopoly that inflates prices, stifles innovation, and gates access to enchantment services behind wealth and social connections. Underground enchanters operate outside the guild, offering cheaper work of variable quality \u2014 and risking severe legal penalties.",
        fields: {
          resource_type: "refined_product",
          extraction_method: "Guild members perform enchantments using standardized techniques and certified materials. Apprenticeship takes seven years, followed by a masterwork examination. Only licensed guild members may legally sell enchantment services.",
          refinement_process: "Raw magical materials are processed in guild-certified workshops using approved methods. Each enchanted item receives a guild seal certifying its quality grade and the enchanter responsible.",
          geographic_distribution: "Guild halls in every major city, with regional chapters in larger towns. Rural areas are underserved \u2014 traveling guild enchanters visit on seasonal circuits, charging premium rates.",
          renewability: "renewable",
          strategic_importance: "major",
          market_structure: "guild_controlled",
          controlling_entities: "The Grand Council of Enchanters sets policy, pricing floors, and licensing standards. Regional guild-masters enforce compliance. The guild maintains close relationships with governments, who rely on guild services for military and infrastructure enchantments.",
          black_market_details: "Unlicensed enchanters operate in back alleys and frontier towns, offering work at half the guild rate. Quality ranges from surprisingly competent journeymen who refused to join, to dangerous amateurs whose enchantments fail catastrophically. The guild employs investigators to identify and prosecute illegal practitioners."
        }
      },
      {
        id: "mana_currency",
        name: "Mana Currency",
        description: "A society that uses raw mana as money. You literally spend magical energy to buy goods.",
        element_type: "trade_good",
        summary: "A monetary system where raw magical energy serves as currency \u2014 spend your power to buy your bread",
        detailed_notes: "In mana-currency economies, standardized units of magical energy function as money. Mana is stored in certified crystals of precise capacity, issued by a central authority, and exchanged for goods and services. The system has elegant properties: mana cannot be counterfeited (each crystal has a unique resonance signature), supply is tied to real magical production, and the currency is intrinsically useful \u2014 in an emergency, you can shatter your savings and cast a spell with it. The downsides are severe: the wealthy literally have more magical power than the poor, inflation means spells get more expensive, and a banking crisis could trigger a mana explosion.",
        fields: {
          resource_type: "crystallized_mana",
          extraction_method: "Mana is harvested from ambient fields, ley lines, and biological sources, then compressed into standardized denomination crystals by licensed mana-minters. Each crystal is attuned to a central ledger for tracking.",
          refinement_process: "Raw mana is purified, measured, and sealed into certified crystal vessels of standard sizes. Denominations range from motes (daily purchases) to orbs (major transactions) to cores (national-level exchanges).",
          geographic_distribution: "Dominant in mana-rich regions where the supply of magical energy is reliable. Mana-poor regions use hybrid systems or reject mana currency entirely in favor of metal coinage.",
          renewability: "renewable",
          strategic_importance: "critical",
          market_structure: "state_run",
          controlling_entities: "Central Mana Banks regulate supply, set interest rates (measured in mana-flow), and maintain the ledger crystals. Governments derive power from their ability to mint and control mana currency.",
          environmental_impact_of_extraction: "Currency production requires continuous mana harvesting, creating economic pressure to exploit mana sources. Regions whose mana is extracted for currency production experience ecological depletion while wealthy cities accumulate dangerous concentrations of stored mana."
        }
      },
      {
        id: "spell_insurance",
        name: "Spell Insurance",
        description: "A business that insures against magical accidents. The actuarial science of fireballs.",
        element_type: "regulation",
        summary: "An insurance industry built around the unpredictable risks of magic \u2014 premiums scaled to spell danger",
        detailed_notes: "Spell insurance emerged after a series of catastrophic magical accidents bankrupted the individuals responsible. The industry provides coverage for property damage, personal injury, and liability arising from magical practice. Policies cover everything from alchemical workshop explosions to summoning mishaps to enchantment failures. Premiums are calculated using arcane actuarial models that factor in spell school, caster experience, local mana conditions, and historical incident rates. The industry has become a powerful force for magical safety regulation \u2014 insurers refuse to cover practitioners who skip safety protocols, effectively enforcing standards that governments struggle to mandate.",
        fields: {
          resource_type: "refined_product",
          extraction_method: "Insurance premiums are collected from magical practitioners, businesses that use enchanted goods, and property owners in magically active areas. Claims are investigated by specialist magical adjusters who determine fault and assess arcane damage.",
          refinement_process: "Risk assessment involves divination-assisted actuarial modeling, historical incident analysis, and on-site magical hazard surveys. Policies are written on enchanted contracts that are self-enforcing \u2014 attempts to defraud trigger automatic claim denial.",
          geographic_distribution: 'Concentrated in urban areas with high magical activity. Major insurers operate from financial capitals. Rural and frontier areas are often deemed "uninsurable" due to lack of data and emergency response infrastructure.',
          renewability: "renewable",
          strategic_importance: "moderate",
          market_structure: "oligopoly",
          controlling_entities: "A handful of major insurance houses dominate the market, backed by vast mana reserves to cover catastrophic claims. Reinsurance \u2014 insuring the insurers \u2014 is handled by a single ancient institution with enough reserves to survive a magical apocalypse.",
          black_market_details: "Fraudulent insurance is rampant at the margins \u2014 fake policies sold to naive practitioners, staged accidents for claims payouts, and arson-by-enchantment schemes. The insurers' investigation departments are among the most feared magical law enforcement bodies in existence."
        }
      },
      {
        id: "soul_market",
        name: "Soul Market",
        description: "A market for trading soul fragments: memories, skills, years of life.",
        element_type: "black_market",
        summary: "An underground market where fragments of the soul are bought and sold \u2014 memories, skills, and years of life as commodities",
        detailed_notes: "The Soul Market trades in the most personal currency imaginable: pieces of the self. Through forbidden necromantic and psychic techniques, soul fragments can be extracted, bottled, and sold. A warrior's combat reflexes, a scholar's decades of study, a lover's most passionate memories \u2014 all can be purchased and integrated by the buyer. The market operates in hidden locations, shifting to avoid authorities, and its customers include the desperate (selling memories of trauma), the ambitious (buying skills they lack time to learn), and the dying (selling remaining years to fund their heirs). Prices are set by rarity and quality \u2014 a master swordsman's muscle memory costs more than a farmhand's. The trade is universally illegal and universally practiced. Its existence raises the darkest questions about personhood: if you sell your memories of childhood, are you still the same person? If you buy another's skills, are your achievements your own?",
        fields: {
          resource_type: "biological",
          extraction_method: "Soul-tapping \u2014 a forbidden psychic technique performed by trained extractors using enchanted implements. The seller enters a trance state while the extractor isolates and removes the targeted fragment. The process is painful and disorienting. Involuntary extraction is possible but leaves obvious psychic scarring.",
          geographic_distribution: "Soul Markets operate in the shadows of every major city. The largest and most sophisticated markets are found in cosmopolitan trade hubs where law enforcement is stretched thin. Some frontier regions tolerate the trade openly.",
          strategic_importance: "critical",
          market_structure: "auction",
          controlling_entities: "A loose network of soul-brokers who verify quality, mediate disputes, and enforce the market's internal rules. No single entity controls the trade, but several criminal organizations provide protection and logistics in exchange for a cut of every transaction.",
          environmental_impact_of_extraction: "Victims of excessive soul extraction become hollow \u2014 functional but emotionless, identity-less husks. Communities with heavy soul-market activity report increased depression, anomie, and a pervasive sense of loss among the general population, suggesting ambient psychic contamination."
        }
      },
      {
        id: "mana_bank",
        name: "Mana Bank",
        description: "An institution that stores and lends magical energy. Interest accrues as spell potential.",
        element_type: "regulation",
        summary: "A financial institution that stores mana deposits and issues mana loans \u2014 banking redefined for a magical economy",
        detailed_notes: "Mana banks operate on the same principles as conventional banks but with magical energy instead of currency. Depositors store excess mana in crystalline vaults, earning interest as the bank invests their deposits in mana-intensive enterprises. Borrowers take mana loans to fund magical projects \u2014 enchantment workshops, ward installations, or agricultural growth-spells \u2014 and repay with interest. The system has enabled large-scale magical infrastructure that no individual practitioner could fund alone. Mana banks have become enormously powerful institutions, controlling access to magical energy and thereby influencing which projects proceed and which fail. The risk of a mana bank run \u2014 all depositors withdrawing simultaneously \u2014 is the financial system's greatest fear, as the resulting mana release could be physically catastrophic in addition to economically devastating.",
        fields: {
          resource_type: "crystallized_mana",
          extraction_method: "Depositors channel mana into standardized storage crystals maintained in the bank's vault. Withdrawal requires identity verification through mana-signature matching. Interest is calculated as a percentage of mana-flow and crystallized at regular intervals.",
          geographic_distribution: "Major mana banks operate in every significant city, with headquarters in financial capitals. Branch networks extend into larger towns. Rural areas are served by traveling mana-agents who collect deposits and issue small loans.",
          strategic_importance: "major",
          market_structure: "oligopoly",
          controlling_entities: "A small number of ancient banking houses control the majority of mana deposits. These institutions wield political influence rivaling governments, as their lending decisions determine which magical projects \u2014 and therefore which civilizations \u2014 thrive or wither.",
          environmental_impact_of_extraction: "Mana banking concentrates magical energy in urban vaults, draining it from the surrounding environment. Bank districts often exhibit mana-dead zones in their immediate vicinity while the vaults themselves are dangerously over-saturated. Vault breaches release catastrophic mana surges."
        }
      },
      {
        id: "artifice_factory",
        name: "Artifice Factory",
        description: "Mass production of enchanted goods. Magical industrialization.",
        element_type: "profession",
        summary: "Factories that mass-produce enchanted goods \u2014 the magical equivalent of industrial manufacturing",
        detailed_notes: "Artifice factories represent the industrialization of enchantment. Where once every magical item was a unique creation of a master enchanter, factories use standardized enchantment templates, assembly-line processes, and semi-skilled workers to produce enchanted goods at scale. Glow-lamps, warming stones, self-sharpening blades, preservation boxes \u2014 these everyday enchantments are now affordable consumer goods rather than luxury items. The factories employ hundreds of workers performing repetitive enchantment tasks, guided by master templates created by high-level artificers. The quality is consistent but uninspired \u2014 factory enchantments lack the artistry and potency of hand-crafted work. The social consequences mirror industrial revolution dynamics: traditional enchanters are displaced, factory workers face repetitive mana-exposure injuries, and enchantment guilds are locked in conflict with factory owners over labor practices and quality standards.",
        fields: {
          resource_type: "refined_product",
          extraction_method: "Assembly-line enchantment using standardized templates. Raw goods enter one end of the factory, pass through sequential enchantment stations where workers apply specific spell-layers, and emerge as finished enchanted products. Quality control mages inspect output at the end of the line.",
          geographic_distribution: "Concentrated in cities with strong mana infrastructure and large labor pools. Industrial districts cluster around ley line access points for power. Factory towns have sprung up around major mana crystal deposits, combining extraction and production.",
          strategic_importance: "major",
          market_structure: "free_market",
          controlling_entities: "Factory owners \u2014 a new class of magical industrialists \u2014 control production. Enchantment guilds fight for regulatory oversight and labor standards. Governments are torn between the economic benefits of cheap enchanted goods and the social costs of displacing traditional artisans.",
          environmental_impact_of_extraction: "Factory enchantment processes produce magical waste \u2014 residual mana contaminated with spell fragments that cannot be safely recycled. Mana pollution accumulates in factory districts, causing localized wild magic events, health problems in workers, and environmental degradation. Waste disposal is poorly regulated and often involves dumping contaminated mana into waterways or soil."
        }
      },
      {
        id: "mana_debt",
        name: "Mana Debt",
        description: "Magical energy borrowed from the future. Spend now, pay later \u2014 with interest.",
        element_type: "resource",
        summary: "Mana borrowed against the future \u2014 powerful now, catastrophic when the bill comes due",
        detailed_notes: "Mana debt is the practice of drawing magical energy from potential futures and spending it in the present. The mechanism varies \u2014 temporal siphoning, over-drafting ley lines, or binding future generations to repay current expenditures. The borrowed mana is high-quality and immediately available, making it irresistible for large-scale projects, wars, and infrastructure. But the debt compounds. Interest accrues as mana-entropy, and the future from which the energy was borrowed becomes impoverished. Regions that have taken on too much mana debt experience temporal instability, ecological collapse, and the gradual dimming of all magical potential. Civilizations that rely on mana debt are engaged in a slow-motion catastrophe \u2014 each generation inherits less magical potential than the last, driving them to borrow even more.",
        fields: {
          resource_type: "custom",
          extraction_method: "Temporal siphoning rituals draw mana from future timelines. Ley line over-drafting pulls more mana than the natural cycle can sustain. Generational binding contracts pledge descendant communities to repay with their own magical potential.",
          refinement_process: "Borrowed mana arrives ready to use \u2014 no refinement needed. This convenience is part of what makes it so dangerous and addictive.",
          geographic_distribution: "Mana debt is most prevalent in civilizations facing existential threats or pursuing ambitious projects beyond their natural magical means. War-torn regions, declining empires, and newly founded states are common borrowers.",
          renewability: "non_renewable",
          strategic_importance: "critical",
          market_structure: "auction",
          controlling_entities: "Shadow brokers and temporal mages facilitate the lending. Some governments are secretly the largest debtors. A few ancient institutions track the total outstanding debt and warn \u2014 mostly unheeded \u2014 of approaching collapse thresholds.",
          environmental_impact_of_extraction: "Localized temporal instability \u2014 clocks stutter, cause and effect hiccup, and d\xE9j\xE0 vu becomes endemic. Heavy debt regions experience mana dimming as the future's magical potential is consumed in advance."
        }
      }
    ],
    defaultSortField: "resource_type"
  };

  // src/domains/history.ts
  var historyConfig = {
    id: "history",
    name: "Historical Event",
    namePlural: "History",
    icon: "scroll",
    color: "#95a5a6",
    description: "Chronicle the major events, eras, and turning points that have shaped your world. From wars and discoveries to disasters and cultural revolutions, history provides the narrative backbone that connects all other domains across time.",
    tableName: "historical_events",
    category: "meta",
    fields: [
      {
        name: "era_id",
        label: "Era",
        type: "text",
        placeholder: "ID of the historical era this event belongs to",
        helpText: "The broader era or age in which this event took place."
      },
      {
        name: "year_in_world",
        label: "Year (In-World)",
        type: "text",
        placeholder: "e.g. 3rd Age, Year 1247; 500 BF (Before Founding)",
        helpText: "The date or year of this event in your world's calendar system."
      },
      {
        name: "duration",
        label: "Duration",
        type: "text",
        placeholder: "e.g. 3 days, 30 years, instantaneous",
        helpText: "How long the event lasted\u2014from a single moment to centuries-long processes."
      },
      {
        name: "event_type",
        label: "Event Type",
        type: "select",
        required: true,
        options: ["war", "discovery", "founding", "disaster", "migration", "cultural", "political", "magical", "technological", "economic"],
        helpText: "The primary category of this historical event."
      },
      {
        name: "participants",
        label: "Participants",
        type: "json",
        placeholder: '["Kingdom of Aldara", "the Dragon Lords", "Archmage Velen"]',
        helpText: "Key civilizations, factions, or individuals involved in this event."
      },
      {
        name: "consequences",
        label: "Consequences",
        type: "json",
        placeholder: '["fall of the old empire", "discovery of mithril", "planar seal broken"]',
        helpText: "The major outcomes and lasting effects of this event."
      },
      {
        name: "reliability",
        label: "Reliability",
        type: "select",
        options: ["mythological", "legendary", "oral_tradition", "partially_documented", "well_documented", "verified"],
        helpText: "How trustworthy the historical record is for this event \u2014 from pure myth to verified fact."
      },
      {
        name: "geographic_scope",
        label: "Geographic Scope",
        type: "select",
        options: ["local", "regional", "continental", "global", "planar", "cosmic"],
        helpText: "How geographically widespread this event's impact was."
      },
      {
        name: "significance",
        label: "Significance",
        type: "select",
        options: ["minor", "moderate", "major", "transformative", "world_altering"],
        helpText: "The overall historical importance and lasting impact of this event."
      }
    ],
    elementTypes: ["war", "discovery", "founding", "disaster", "migration", "cultural_shift", "political_event", "magical_event", "technological_breakthrough", "economic_event"],
    elementTypeDescriptions: {
      war: "An armed conflict between civilizations, factions, or species. Reshapes borders, topples powers, and scars landscapes for generations.",
      discovery: "A moment when something previously unknown is found or understood \u2014 new lands, scientific principles, magical techniques, or lost knowledge.",
      founding: "The establishment of something new \u2014 a city, nation, order, or institution that will shape the future.",
      disaster: "A catastrophic event \u2014 natural, magical, or artificial \u2014 that devastates a region, population, or way of life.",
      migration: "A large-scale movement of people from one region to another, driven by opportunity, threat, or environmental change.",
      cultural_shift: "A fundamental change in beliefs, values, or practices across a society \u2014 religious reformation, enlightenment, or social revolution.",
      political_event: "A significant change in governance \u2014 coups, treaties, elections, successions, or diplomatic breakthroughs.",
      magical_event: "A historically significant magical occurrence \u2014 a great working, catastrophic spell failure, or shift in the nature of magic itself.",
      technological_breakthrough: "An invention or discovery that fundamentally changes what a civilization can do \u2014 new materials, techniques, or devices.",
      economic_event: "A major economic shift \u2014 trade route discovery, resource depletion, market collapse, or the rise of a new industry."
    },
    prompts: [
      "What are the defining conflicts in your world's history? Were they fought over land, resources, ideology, or magical power?",
      "What event do all cultures in your world agree was the most important, and how do their interpretations of it differ?",
      "What knowledge or capability has been lost to history? Are there dark ages that people are still recovering from?",
      "How reliable is the historical record? Who writes history, and what have they chosen to omit or distort?",
      "What is the most recent major event, and how are its consequences still unfolding in the present day?"
    ],
    magicPermeation: {
      companionTable: "history_magic_aspects",
      fields: [
        {
          name: "magical_cataclysms",
          label: "Magical Cataclysms",
          type: "textarea",
          helpText: "Catastrophic magical events\u2014mana explosions, ley line collapses, planar breaches that reshaped the world."
        },
        {
          name: "magic_discovery_milestones",
          label: "Magic Discovery Milestones",
          type: "textarea",
          helpText: "Key moments when new forms of magic were discovered, understood, or unlocked."
        },
        {
          name: "magitech_revolutions",
          label: "Magitech Revolutions",
          type: "textarea",
          helpText: "Periods when the fusion of magic and technology transformed society\u2014equivalent to industrial revolutions."
        },
        {
          name: "magical_wars",
          label: "Magical Wars",
          type: "textarea",
          helpText: "Conflicts fought primarily with or over magic\u2014mage wars, resource wars over mana deposits, spell arms races."
        },
        {
          name: "rise_fall_magical_empires",
          label: "Rise & Fall of Magical Empires",
          type: "textarea",
          helpText: "Civilizations whose power was built on magic and how they rose, peaked, and declined."
        },
        {
          name: "legendary_practitioners",
          label: "Legendary Practitioners",
          type: "textarea",
          helpText: "Historical figures whose magical achievements or failures shaped the course of history."
        },
        {
          name: "magical_artifacts_historical",
          label: "Historical Magical Artifacts",
          type: "textarea",
          helpText: "Legendary magical items whose creation, use, or loss was historically significant."
        },
        {
          name: "magical_plagues",
          label: "Magical Plagues",
          type: "textarea",
          helpText: "Magical diseases, curses, or corruptions that swept through populations or regions."
        },
        {
          name: "periods_of_magical_suppression",
          label: "Periods of Magical Suppression",
          type: "textarea",
          helpText: "Eras when magic was banned, persecuted, or deliberately forgotten\u2014and why."
        },
        {
          name: "lost_magical_knowledge",
          label: "Lost Magical Knowledge",
          type: "textarea",
          helpText: "Magical arts, spells, or techniques that were once known but have been lost to time."
        },
        {
          name: "prophecies",
          label: "Prophecies",
          type: "textarea",
          helpText: "Prophecies, divinations, or magical foretellings that have influenced historical decisions."
        },
        {
          name: "magic_relevance",
          label: "Magic Relevance",
          type: "select",
          options: ["none", "minor", "moderate", "major", "fundamental"],
          helpText: "How central magic is to the significance of this historical event."
        },
        {
          name: "custom_magic_notes",
          label: "Custom Magic Notes",
          type: "textarea",
          placeholder: "Any additional notes about magical aspects...",
          helpText: "Free-form notes on magical properties not covered above."
        }
      ],
      manaSensitivity: "passive",
      planeAware: true,
      prompts: [
        "What was the most devastating magical cataclysm in your world's history, and how did survivors rebuild in its aftermath?",
        "Has magic been lost and rediscovered over the course of history? What caused the loss, and was the rediscovered magic the same as what came before?",
        "How have prophecies shaped history? Have rulers gone to war, built empires, or destroyed knowledge because of what seers foretold?"
      ]
    },
    archetypes: [
      {
        id: "great_war",
        name: "Great War",
        description: "A devastating conflict that reshapes borders, topples dynasties, and scars the land for generations.",
        element_type: "war",
        summary: "A continent-spanning conflict that redrew the map",
        detailed_notes: "A conflict drawn from deep grievances \u2014 territorial disputes, succession crises, or ideological divides. Multiple civilizations are drawn in through alliances and opportunism. The war ends with a new political order, but the resentments smolder.",
        fields: {
          event_type: "war",
          duration: "Years to decades",
          reliability: "well_documented",
          geographic_scope: "continental",
          significance: "transformative"
        }
      },
      {
        id: "founding_of_nation",
        name: "Founding of a Nation",
        description: "The birth of a new civilization \u2014 through revolution, unification, or colonization of new lands.",
        element_type: "founding",
        summary: "The founding moment of a civilization",
        detailed_notes: "A pivotal moment when scattered peoples coalesce into a recognized polity. The founding myth will be retold for millennia, growing grander with each generation. The founder-figures become legends, their flaws forgotten.",
        fields: {
          event_type: "founding",
          duration: "A single pivotal year or a decade of consolidation",
          reliability: "partially_documented",
          geographic_scope: "regional",
          significance: "major"
        }
      },
      {
        id: "natural_catastrophe",
        name: "Natural Catastrophe",
        description: "A cataclysmic natural event \u2014 eruption, flood, or impact \u2014 that devastates a region.",
        element_type: "disaster",
        summary: "A natural disaster that permanently altered the region",
        detailed_notes: "The catastrophe strikes without warning or politics. A volcano buries cities in ash, a tsunami erases coastal civilizations, or a plague sweeps across trade routes. Survivors rebuild, but the cultural trauma endures in myth and architecture.",
        fields: {
          event_type: "disaster",
          duration: "Days to months (immediate), decades (recovery)",
          reliability: "oral_tradition",
          geographic_scope: "regional",
          significance: "transformative"
        }
      },
      {
        id: "age_of_discovery",
        name: "Age of Discovery",
        description: "An era of exploration and contact, when isolated civilizations first encounter each other.",
        element_type: "discovery",
        summary: "An age of exploration and first contact between distant civilizations",
        detailed_notes: "Explorers venture beyond known maps, driven by trade, curiosity, or divine mandate. First contact between civilizations is rarely peaceful \u2014 disease, trade disputes, and cultural misunderstanding follow. But the exchange of ideas and goods transforms both sides.",
        fields: {
          event_type: "discovery",
          duration: "A generation or more",
          reliability: "partially_documented",
          geographic_scope: "global",
          significance: "world_altering"
        }
      },
      {
        id: "the_silence",
        name: "The Silence",
        description: "An event where all magic suddenly stopped working \u2014 every spell failed, every enchantment died, every magical creature collapsed.",
        element_type: "magical_event",
        summary: "The day magic died \u2014 and the long dark that followed",
        detailed_notes: "Without warning, magic ceased. Wards fell. Flying cities crashed. Healing spells stopped mid-cast. Familiars went still. The event lasted anywhere from days to years depending on the account, and its cause remains the most debated question in history. When magic returned, it was... different. Changed. Some schools of magic never recovered.",
        fields: {
          event_type: "magical",
          duration: "Disputed \u2014 between three days and seven years, depending on the source",
          reliability: "oral_tradition",
          geographic_scope: "cosmic",
          significance: "world_altering"
        }
      },
      {
        id: "the_sundering",
        name: "The Sundering",
        description: "A cataclysmic event that broke the world. Continents split, magic changed its nature, civilizations fell in a single day.",
        element_type: "disaster",
        summary: "The day the world broke apart \u2014 continents shattered, magic transformed, and the old order ended",
        detailed_notes: "The Sundering was not a war or a natural disaster \u2014 it was a fundamental rupture in the fabric of reality. In a single cataclysmic day, the world's geography was violently rewritten. Continents cracked apart along lines that may have followed ley line faults. The seas rushed into new chasms. Mountain ranges rose where plains had been. Entire civilizations \u2014 their cities, their histories, their peoples \u2014 were swallowed by the earth or drowned by new oceans. Magic itself changed: spells that had worked for millennia failed, while new forms of magic emerged from the raw energy released by the breaking. Every culture that survived has a version of the story, and none of them agree on the cause.",
        fields: {
          event_type: "disaster",
          duration: "The event itself lasted a single day. The aftershocks \u2014 geological, magical, and civilizational \u2014 continued for centuries.",
          reliability: "legendary",
          geographic_scope: "global",
          significance: "world_altering",
          participants: '["Every civilization that existed at the time \u2014 most did not survive"]',
          consequences: '["Continental geography rewritten", "Pre-Sundering magic lost", "New forms of magic emerged", "Population reduced by an estimated 90%", "All political structures collapsed", "New civilizations built on the ruins"]'
        }
      },
      {
        id: "first_contact_event",
        name: "First Contact",
        description: "The moment two completely isolated civilizations discovered each other's existence. Changed everything for both.",
        element_type: "discovery",
        summary: "The meeting of two worlds that had never known the other existed",
        detailed_notes: "First contact is the hinge-point between isolation and interconnection. Two civilizations, each convinced they were alone in the world \u2014 or at least in their corner of it \u2014 suddenly confront the reality of the other. The initial encounter is almost never peaceful, not from hostility but from sheer incomprehension. Language barriers, incompatible magic systems, different relationships with the divine, and conflicting claims to the same resources create friction that takes generations to resolve. But the exchange that follows \u2014 of ideas, technologies, magical traditions, and genetic diversity \u2014 transforms both cultures beyond recognition. Neither side remains what it was.",
        fields: {
          event_type: "discovery",
          duration: "The initial encounter is a single moment, but the consequences unfold over generations",
          reliability: "partially_documented",
          geographic_scope: "continental",
          significance: "transformative",
          participants: '["Two previously isolated civilizations"]',
          consequences: '["Exchange of magical traditions", "New trade routes established", "Cultural upheaval in both civilizations", "Disease exchange with devastating population effects", "Territorial disputes and eventual wars", "Hybrid cultures emerging in border regions"]'
        }
      },
      {
        id: "forbidden_knowledge_event",
        name: "The Forbidden Discovery",
        description: "A discovery so dangerous that all nations agreed to suppress it. The knowledge persists in whispers.",
        element_type: "discovery",
        summary: "A discovery so terrible that every nation agreed it must be forgotten \u2014 but knowledge is hard to kill",
        detailed_notes: "Some knowledge is too dangerous to possess. The Forbidden Discovery \u2014 its true nature varies by world, but it is always something that could end civilization if widely known \u2014 was made by a researcher, explorer, or mage who immediately recognized its destructive potential. In a rare moment of international cooperation, rival nations agreed to suppress the discovery: records were burned, researchers were silenced (by oath, by magic, or by execution), and the very existence of the knowledge was denied. But suppression is never complete. Fragments survive in coded texts, oral traditions among secret societies, and the independent rediscovery by brilliant minds who stumble onto the same path. The tension between those who guard the secret and those who seek it drives conspiracies, inquisitions, and shadow wars across generations.",
        fields: {
          event_type: "discovery",
          duration: "The discovery itself was instantaneous. The suppression campaign lasted decades. The secret has persisted for centuries.",
          reliability: "oral_tradition",
          geographic_scope: "global",
          significance: "world_altering",
          participants: '["The original discoverer (identity disputed or erased)", "A coalition of nations that agreed to suppress", "Secret societies that preserved fragments", "Inquisitorial orders tasked with enforcing the ban"]',
          consequences: '["International suppression treaty \u2014 one of the few agreements all nations honor", "Creation of inquisitorial orders to hunt forbidden knowledge", "Underground networks preserving and trading fragments", "Periodic rediscoveries triggering crises", "A culture of academic censorship and self-censorship that persists to this day"]'
        }
      },
      {
        id: "the_great_silence",
        name: "The Great Silence",
        description: "An era when all magic stopped. Devastating consequences for magic-dependent civilizations.",
        element_type: "magical_event",
        summary: "A period when all magic ceased to function \u2014 the lights went out and stayed out",
        detailed_notes: "The Silence was not a gradual decline but a sudden, total cessation. One moment magic worked; the next, it did not. Enchantments failed. Wards collapsed. Flying cities fell from the sky. Magical creatures sickened and died. Entire civilizations built on magical infrastructure \u2014 their lighting, heating, agriculture, transportation, and governance all dependent on mana \u2014 collapsed within weeks. The non-magical world adapted more easily, but even they suffered as trade networks, communication systems, and military balances built around magic dissolved overnight. The cause of the Silence remains the most debated question in history: divine punishment, a natural mana cycle reaching its nadir, a deliberate act of sabotage by an unknown agent, or simply a failure mode that no one anticipated. When magic returned, it was subtly different \u2014 some schools stronger, others weaker, and a few entirely new.",
        fields: {
          event_type: "magical",
          duration: "Disputed \u2014 estimates range from three months to seven years depending on the source and region",
          reliability: "oral_tradition",
          geographic_scope: "cosmic",
          significance: "world_altering",
          participants: '["Every magic-dependent civilization", "Non-magical societies that inherited the power vacuum", "Unknown cause or agent"]',
          consequences: '["Collapse of magic-dependent civilizations", "Rise of non-magical powers", "Permanent loss of several schools of magic", "Development of non-magical backup systems", "Profound cultural trauma and anti-magic sentiment in some regions", "New forms of magic emerged when the Silence ended"]'
        }
      },
      {
        id: "golden_age",
        name: "The Golden Age",
        description: "Unprecedented peace and prosperity, now lost and romanticized.",
        element_type: "cultural_shift",
        summary: "An era of unmatched peace, prosperity, and achievement \u2014 now lost and endlessly mourned",
        detailed_notes: "Every civilization has its Golden Age \u2014 a period of unprecedented peace, prosperity, cultural flowering, and technological or magical advancement. The Golden Age is always in the past, always romanticized, and always more complex than the stories suggest. The peace was maintained by a balance of power that could not last. The prosperity was unevenly distributed. The cultural achievements were real but built on labor and sacrifice that the nostalgic narratives omit. Nevertheless, the Golden Age represents a genuine peak in civilizational achievement: great works of art, architecture, and scholarship were produced; populations grew and thrived; and the major powers cooperated more than they competed. Its end \u2014 through war, disaster, internal decay, or simple exhaustion \u2014 defines the trajectory of everything that follows. Every subsequent generation measures itself against the Golden Age and finds itself wanting.",
        fields: {
          event_type: "cultural",
          duration: "One to three centuries \u2014 long enough to seem eternal to those living in it, short enough to be recognizable as an era in retrospect",
          reliability: "partially_documented",
          geographic_scope: "continental",
          significance: "transformative",
          participants: '["The dominant civilizations of the period", "Artists, scholars, and builders whose works define the era", "The underclasses whose labor supported the golden age (often omitted from accounts)"]',
          consequences: `["A cultural benchmark against which all subsequent eras are measured", "Monumental works of art, architecture, and literature that survive", "A nostalgia that shapes politics for centuries after", "The seeds of the era's own destruction, planted during its peak"]`
        }
      },
      {
        id: "the_awakening",
        name: "The Awakening",
        description: "The moment a world's population collectively gained magical ability.",
        element_type: "magical_event",
        summary: "The day everyone became a mage \u2014 and the world was never the same",
        detailed_notes: "The Awakening was the moment when magical ability, previously limited to a rare few, suddenly manifested in every sentient being simultaneously. A farmer discovered he could ignite fires with a thought. A child levitated in her cradle. A king found his court wizard was no longer special. The immediate aftermath was chaos: untrained magic users caused devastating accidental damage, power structures built on magical exclusivity collapsed overnight, and the sheer volume of ambient mana being channeled by billions of new practitioners destabilized ley lines and planar boundaries. Over the following decades, society completely restructured around universal magical ability. Education systems were overhauled. Legal frameworks were rewritten. Economic systems adapted to a world where anyone could enchant, heal, or destroy. The Awakening is the single most transformative event in recorded history \u2014 the moment when magic ceased to be a privilege and became a fact of life.",
        fields: {
          event_type: "magical",
          duration: "The Awakening itself was instantaneous. The social transformation it triggered continues for generations.",
          reliability: "well_documented",
          geographic_scope: "global",
          significance: "world_altering",
          participants: '["Every sentient being alive at the moment of Awakening", "Former magical elites who lost their monopoly", "Governments scrambling to adapt", "New institutions created to manage universal magic"]',
          consequences: '["Universal magical ability across all sentient species", "Collapse of magical aristocracies and exclusivity", "Mass casualties from untrained magical accidents", "Complete restructuring of education, law, and economy", "Destabilization of ley lines and planar boundaries from massive mana draw", "Emergence of new social hierarchies based on magical talent rather than magical access"]'
        }
      },
      {
        id: "founding_nation",
        name: "Founding of a Nation",
        description: "The birth of a new civilization through revolution, unification, or colonization.",
        element_type: "founding",
        summary: "The pivotal moment when a new nation was born",
        detailed_notes: "A founding event marks the moment scattered peoples, rebel factions, or colonial settlers coalesce into a recognized polity. The founding myth \u2014 whether revolution, divine mandate, or treaty \u2014 will be retold and embellished for millennia. The founder-figures become legends, their compromises forgotten and their flaws erased by grateful descendants.",
        fields: {
          event_type: "founding",
          duration: "A single pivotal year or a decade of consolidation",
          reliability: "partially_documented",
          geographic_scope: "regional",
          significance: "major"
        }
      }
    ],
    defaultSortField: "year_in_world"
  };

  // src/domains/geography.ts
  var geographyConfig = {
    id: "geography",
    name: "Geographic Place",
    namePlural: "Geography",
    icon: "map-pin",
    color: "#e67e22",
    description: "Place the cities, fortresses, roads, temples, and landmarks of your world on the map. Geography ties together the natural landscape with the built environment, giving your civilizations concrete locations and your stories tangible settings.",
    tableName: "geographical_places",
    category: "meta",
    fields: [
      {
        name: "place_type",
        label: "Place Type",
        type: "select",
        required: true,
        options: ["city", "town", "village", "fortress", "ruin", "landmark", "road", "port", "temple", "academy"],
        helpText: "The primary classification of this geographic location."
      },
      {
        name: "population",
        label: "Population",
        type: "text",
        placeholder: "e.g. 50,000; abandoned; seasonal",
        helpText: "Current population or occupancy of this location."
      },
      {
        name: "founded_era_id",
        label: "Founded Era",
        type: "text",
        placeholder: "ID of the era when this place was established",
        helpText: "The historical era in which this place was founded or first settled."
      },
      {
        name: "climate_zone_id",
        label: "Climate Zone",
        type: "text",
        placeholder: "ID of the climate zone this place is in",
        helpText: "The climate zone governing this location's weather and seasons."
      },
      {
        name: "biome_id",
        label: "Biome",
        type: "text",
        placeholder: "ID of the biome this place is in",
        helpText: "The biome or ecological region this location sits within."
      },
      {
        name: "terrain_description",
        label: "Terrain Description",
        type: "textarea",
        placeholder: "Describe the physical landscape \u2014 hills, rivers, soil, vegetation...",
        helpText: "The physical terrain and natural features of this location and its surroundings."
      },
      {
        name: "controlling_civilization_id",
        label: "Controlling Civilization",
        type: "text",
        placeholder: "ID of the civilization that currently controls this place",
        helpText: "The civilization, faction, or power that currently governs this location."
      },
      {
        name: "coordinates_x",
        label: "Map X Coordinate",
        type: "number",
        helpText: "Horizontal position on the world map."
      },
      {
        name: "coordinates_y",
        label: "Map Y Coordinate",
        type: "number",
        helpText: "Vertical position on the world map."
      },
      {
        name: "map_id",
        label: "Map",
        type: "text",
        placeholder: "ID of the map this place appears on",
        helpText: "The map on which this location is placed."
      },
      {
        name: "resources",
        label: "Resources",
        type: "textarea",
        placeholder: "Describe available natural, economic, or magical resources...",
        helpText: "Natural, economic, or magical resources available at or near this location."
      },
      {
        name: "trade_role",
        label: "Trade Role",
        type: "select",
        options: ["isolated", "minor_stop", "regional_hub", "major_crossroads", "capital_market", "global_nexus"],
        helpText: "This location's importance in trade networks."
      },
      {
        name: "accessibility",
        label: "Accessibility",
        type: "select",
        options: ["inaccessible", "remote", "difficult", "moderate", "accessible", "major_thoroughfare"],
        helpText: "How easy it is to reach this location by conventional means."
      }
    ],
    elementTypes: ["city", "town", "village", "fortress", "ruin", "landmark", "road", "port", "temple", "academy", "wilderness", "custom"],
    elementTypeDescriptions: {
      city: "A large, densely populated settlement \u2014 a center of trade, governance, culture, and power.",
      town: "A mid-sized settlement larger than a village but smaller than a city. Often serves as a regional hub for trade and services.",
      village: "A small rural settlement, typically agricultural. The most common form of community in most worlds.",
      fortress: "A heavily fortified structure built for defense \u2014 castles, citadels, wall complexes, or magical strongholds.",
      ruin: "The remains of a once-great structure or settlement, now abandoned. Holds secrets, dangers, and echoes of the past.",
      landmark: "A notable natural or constructed feature used for navigation and cultural identity \u2014 a great tree, monument, or unusual formation.",
      road: "A constructed route connecting settlements. Trade roads, highways, pilgrimage paths, or magical ley-line highways.",
      port: "A coastal or riverine settlement built around maritime trade. Where ships dock, goods flow, and cultures mix.",
      temple: "A sacred site dedicated to worship, spiritual practice, or magical study. May hold significant power or relics.",
      academy: "An institution of learning \u2014 universities, wizard schools, military academies, or monastic centers of knowledge.",
      wilderness: "An untamed region with no permanent settlements. Forests, wastelands, or uncharted territories beyond civilization's reach.",
      custom: "A place that doesn't fit standard categories \u2014 something unique to your world's geography."
    },
    prompts: [
      "What makes the greatest city in your world great? Is it size, wealth, magical power, strategic location, or cultural prestige?",
      "What ruins dot the landscape, and what stories do they tell about civilizations that came before?",
      "How do trade routes and roads connect the major settlements? Are there dangerous stretches that travelers fear?",
      "Where are the sacred sites\u2014temples, groves, ley line nexuses\u2014and who controls access to them?",
      "What natural landmarks define the mental map of your world's inhabitants? What mountains, rivers, or forests do they use to orient themselves?"
    ],
    magicPermeation: {
      companionTable: "geography_magic_aspects",
      fields: [
        {
          name: "magical_landmarks",
          label: "Magical Landmarks",
          type: "textarea",
          helpText: "Notable magical features at this location\u2014arcane towers, enchanted springs, petrified titans, floating islands."
        },
        {
          name: "ley_line_geography",
          label: "Ley Line Geography",
          type: "textarea",
          helpText: "How ley lines pass through, converge at, or avoid this location. Ley line nodes and their effects."
        },
        {
          name: "planar_crossings",
          label: "Planar Crossings",
          type: "textarea",
          helpText: "Points where other planes bleed through\u2014permanent portals, thin spots, seasonal gates."
        },
        {
          name: "enchanted_territories",
          label: "Enchanted Territories",
          type: "textarea",
          helpText: "Areas under persistent magical effects\u2014ever-winter zones, time-dilated regions, areas of wild magic."
        },
        {
          name: "mana_density_map_description",
          label: "Mana Density Description",
          type: "textarea",
          helpText: "A description of the ambient mana levels across this location\u2014high, low, fluctuating, dead zones."
        },
        {
          name: "magical_borders",
          label: "Magical Borders",
          type: "textarea",
          helpText: "Borders enforced or defined by magic\u2014ward walls, cursed boundaries, detection barriers."
        },
        {
          name: "sacred_profane_sites",
          label: "Sacred & Profane Sites",
          type: "textarea",
          helpText: "Locations of powerful positive or negative magical significance\u2014blessed groves, cursed battlefields, sites of sacrifice."
        },
        {
          name: "magical_travel_routes",
          label: "Magical Travel Routes",
          type: "textarea",
          helpText: "Teleportation circles, ley line highways, shadow roads, or other magical travel infrastructure."
        },
        {
          name: "forbidden_zones",
          label: "Forbidden Zones",
          type: "textarea",
          helpText: "Areas too dangerous or corrupted to enter\u2014wild magic storms, undead domains, residual curse fields."
        },
        {
          name: "magical_resource_geography",
          label: "Magical Resource Geography",
          type: "textarea",
          helpText: "Where magical resources are found near this location\u2014mana crystal mines, reagent forests, essence springs."
        },
        {
          name: "magic_relevance",
          label: "Magic Relevance",
          type: "select",
          options: ["none", "minor", "moderate", "major", "fundamental"],
          helpText: "How central magic is to the identity and function of this place."
        },
        {
          name: "custom_magic_notes",
          label: "Custom Magic Notes",
          type: "textarea",
          placeholder: "Any additional notes about magical aspects...",
          helpText: "Free-form notes on magical properties not covered above."
        }
      ],
      manaSensitivity: "reactive",
      planeAware: true,
      prompts: [
        "How does the magical geography of your world influence where civilizations build their cities? Do settlements cluster around ley line nexuses, mana springs, or portal sites?",
        "Are there places so saturated with magic that they are fundamentally altered\u2014forests that think, mountains that move, deserts where time flows backward?",
        "What forbidden zones exist, and what catastrophe or corruption created them? Do people dare to enter, and what do they find?"
      ]
    },
    archetypes: [
      {
        id: "capital_city",
        name: "Capital City",
        description: "A major city serving as the seat of government, trade, and culture for a civilization.",
        element_type: "city",
        summary: "A bustling capital city at the heart of a realm",
        fields: {
          place_type: "city",
          population: "50,000-500,000",
          trade_role: "capital_market",
          accessibility: "major_thoroughfare",
          terrain_description: "Built at a strategic confluence of roads and rivers. The city sprawls outward from a fortified inner district, with distinct quarters for merchants, artisans, temples, and the poor.",
          resources: "As a capital, it draws resources from across the realm \u2014 grain from the provinces, luxury goods from trade partners, and taxes in coin and kind."
        }
      },
      {
        id: "frontier_town",
        name: "Frontier Town",
        description: "A rough-hewn settlement on the edge of civilization, attracting pioneers, outcasts, and the ambitious.",
        element_type: "town",
        summary: "A rough settlement at the edge of the known world",
        fields: {
          place_type: "town",
          population: "500-3,000",
          trade_role: "minor_stop",
          accessibility: "difficult",
          terrain_description: "A cluster of wooden buildings around a central well or crossroads, with a palisade wall in various states of repair. Surrounded by partially cleared wilderness.",
          resources: "Timber, furs, and whatever the surrounding wilderness provides. A jumping-off point for prospectors, hunters, and those fleeing settled lands."
        }
      },
      {
        id: "ancient_ruins",
        name: "Ancient Ruins",
        description: "The crumbling remains of a once-great structure or settlement, now reclaimed by nature.",
        element_type: "ruin",
        summary: "Mysterious ruins of a fallen civilization",
        fields: {
          place_type: "ruin",
          population: "Uninhabited (or squatters and creatures)",
          trade_role: "isolated",
          accessibility: "difficult",
          terrain_description: "Overgrown stone foundations and toppled columns half-buried in vegetation. The original layout is barely discernible. Underground levels may remain partially intact.",
          resources: "Archaeological salvage, ancient artifacts, and whatever creatures have made the ruins their lair. Scholars and treasure-hunters are drawn here."
        }
      },
      {
        id: "mountain_fortress",
        name: "Mountain Fortress",
        description: "A heavily fortified stronghold built into or atop a mountain, commanding the surrounding terrain.",
        element_type: "fortress",
        summary: "An impregnable fortress carved into the mountainside",
        fields: {
          place_type: "fortress",
          population: "200-2,000 (garrison)",
          trade_role: "isolated",
          accessibility: "difficult",
          terrain_description: "Cut into the living rock of a mountain peak or cliff face. A single switchback road provides the only approach, easily defended. Cisterns and storerooms allow extended siege survival.",
          resources: "Minimal local resources \u2014 the fortress depends on supply from lower elevations. Mountain springs provide water. Stone quarrying for ongoing construction."
        }
      },
      {
        id: "trade_port",
        name: "Trade Port",
        description: "A coastal or riverine port city whose wealth flows from maritime commerce.",
        element_type: "port",
        summary: "A thriving harbor city built on maritime trade",
        fields: {
          place_type: "port",
          population: "10,000-100,000",
          trade_role: "major_crossroads",
          accessibility: "accessible",
          terrain_description: "Built around a natural harbor or river mouth. Warehouses and docks dominate the waterfront, while merchant houses and markets fill the streets behind. A lighthouse marks the harbor entrance.",
          resources: "Fish, salt, and maritime goods. The true wealth is in trade \u2014 goods from distant lands pass through the harbor and are taxed, stored, and redistributed."
        }
      },
      {
        id: "walking_citadel",
        name: "Walking Citadel",
        description: "A fortress built on the back of a colossal creature or animated construct, endlessly wandering the landscape.",
        element_type: "fortress",
        summary: "A mobile fortress that never stops moving \u2014 find it if you can",
        fields: {
          place_type: "fortress",
          population: "500-5,000",
          trade_role: "isolated",
          accessibility: "inaccessible",
          terrain_description: "A fortified structure built atop an enormous walking construct or living creature. The citadel sways gently with each step. Rope ladders and pulley lifts provide access when it pauses. Its route is predictable only to those who have studied its patterns for decades.",
          resources: "Whatever the citadel walks over \u2014 it deploys harvesting teams at stops. Rain-catchers and onboard gardens provide water and food. Trade happens at predictable pause-points where merchants gather to wait."
        }
      },
      {
        id: "sunken_library",
        name: "Sunken Library",
        description: "A vast repository of knowledge submerged beneath lake or sea \u2014 its original builders chose water as the ultimate firebreak.",
        element_type: "ruin",
        summary: "An underwater archive, still intact, holding knowledge the surface world has forgotten",
        fields: {
          place_type: "ruin",
          population: "A small order of amphibious scholar-divers maintains it",
          trade_role: "isolated",
          accessibility: "inaccessible",
          terrain_description: "Domed chambers of enchanted glass and coral-encrusted stone, visible from above as a shimmer beneath the surface. Air-filled reading rooms connect via flooded corridors. Bioluminescent organisms provide light. The collection is written on waterproof metal sheets and crystal tablets.",
          resources: "Knowledge itself is the resource \u2014 maps, histories, and spell formulae from a fallen civilization. Scholars pay dearly for transcriptions. Some chambers remain sealed and their contents are unknown."
        }
      },
      {
        id: "crossroads_town",
        name: "Crossroads Town",
        description: "A settlement at the intersection of major trade routes. Cosmopolitan, wealthy, contested by powers on all sides.",
        element_type: "town",
        summary: "A prosperous town where trade routes converge, drawing merchants and conflict in equal measure",
        detailed_notes: "Crossroads towns exist because geography demands them. Where major roads meet, rivers fork, or mountain passes converge, a settlement inevitably grows to service the travelers and merchants who pass through. These towns are defined by their diversity \u2014 every culture, language, and religion is represented in their markets. Wealth flows freely, but so does tension. Multiple powers claim influence or outright sovereignty, and the town's independence \u2014 if it has any \u2014 depends on playing rivals against each other. The permanent residents are outnumbered by transients, giving the town a restless, impermanent energy. Everything is for sale, everyone is passing through, and loyalties shift with the trade winds.",
        fields: {
          place_type: "town",
          population: "5,000-20,000 permanent, with transient population doubling the count during trading seasons",
          trade_role: "major_crossroads",
          accessibility: "major_thoroughfare",
          terrain_description: "Built at the intersection of two or more major roads, often near a river crossing or bridge. The town radiates outward from a central market square. Inns, warehouses, and stables dominate the architecture. Caravansaries and trading posts ring the outskirts.",
          resources: "The town produces little itself \u2014 its wealth comes from taxing, storing, and facilitating the trade that passes through. Money-changers, translators, and brokers are the true industries. Information is bought and sold as readily as grain."
        }
      },
      {
        id: "forbidden_zone",
        name: "Forbidden Zone",
        description: "An area sealed off by magic, law, or danger. No one enters. Those who do don't return. Rumors abound.",
        element_type: "wilderness",
        summary: "A sealed and shunned territory where something terrible happened or still lurks",
        detailed_notes: "Forbidden zones are places the world has decided to forget. They are sealed \u2014 by magical barriers, military cordons, or simply by the terror of what lies within. The reasons vary: a magical catastrophe that left the area lethally unstable, a contained threat that must not be released, a curse so potent that proximity is dangerous, or a secret so valuable that access is controlled by force. Maps mark them with warnings or leave them blank. Local populations develop traditions of avoidance passed down through generations. But the forbidden always attracts \u2014 treasure hunters, scholars, desperate refugees, and those who believe the official story is a lie. Some return with riches or knowledge. Most do not return at all.",
        fields: {
          place_type: "ruin",
          population: "Officially uninhabited. Unofficially, something lives inside.",
          trade_role: "isolated",
          accessibility: "inaccessible",
          terrain_description: "The boundary is marked \u2014 ward-stones, military checkpoints, or simply a line where all vegetation dies. Beyond, the terrain is wrong in ways that are hard to articulate. Trees grow at angles. Shadows fall in the wrong direction. The air tastes of metal. Deeper in, the landscape becomes increasingly alien, as if the rules governing reality have been rewritten.",
          resources: "Unknown. Expeditions that enter rarely return, and those that do bring back fragments \u2014 strange materials, corrupted artifacts, or samples of flora and fauna found nowhere else. The forbidden zone may contain extraordinary resources, but the cost of extraction exceeds what any rational actor would pay."
        }
      },
      {
        id: "sky_port",
        name: "Sky Port",
        description: "A docking station for flying ships, sky whales, or aerial transport. A city in the clouds, built for altitude.",
        element_type: "port",
        summary: "An aerial harbor for flying vessels, perched at altitude where the sky meets commerce",
        detailed_notes: "Sky ports are engineering marvels built to service aerial transportation \u2014 flying ships, tamed sky creatures, or magical conveyances that travel through the upper atmosphere. They are constructed on mountaintops, floating platforms, or anchored to levitating rock formations, and they serve the same function as maritime ports but for the sky trade. Docking spires extend outward for vessel mooring, while cargo platforms use gravity-manipulation enchantments to load and unload goods. The permanent population lives in a vertical city adapted to altitude \u2014 pressurized quarters, wind-shielded markets, and heated commons. Sky ports are rare, expensive to maintain, and strategically invaluable, as they control access to the fastest trade routes in the world.",
        fields: {
          place_type: "port",
          population: "2,000-15,000 permanent, with transient airship crews and passengers",
          trade_role: "regional_hub",
          accessibility: "difficult",
          terrain_description: "Built on a high mountain peak, floating rock formation, or artificially levitated platform. Docking spires jut outward from the main structure like the branches of a dead tree. Cargo nets and gravity lifts move goods between levels. The wind is constant and brutal \u2014 all structures are aerodynamic and anchored against storms. Views extend to the horizon in every direction.",
          resources: "Thin-air agriculture is impossible \u2014 all food is imported by the very ships the port services. Water is collected from clouds using condensation arrays. The sky port's true resource is its position: the only place for hundreds of miles where aerial vessels can dock, refuel, and trade."
        }
      },
      {
        id: "moving_city",
        name: "Moving City",
        description: "A settlement that physically relocates on legs, wheels, or magic.",
        element_type: "city",
        summary: "A city that walks, rolls, or floats across the landscape \u2014 never staying in one place for long",
        detailed_notes: "The Moving City is a fully functional urban settlement built on a mobile platform \u2014 enormous mechanical legs, enchanted wheels, a levitating foundation, or the back of a colossal creature. The city migrates according to seasonal patterns, resource availability, or the political decisions of its rulers. Its inhabitants are urban dwellers who have never known stationary life: buildings are designed to withstand movement, streets are cambered for tilting, and all infrastructure is shock-mounted. The city's arrival at a region brings trade, cultural exchange, and economic disruption in equal measure. Its departure leaves trampled ground, depleted resources, and communities that grew dependent on its markets suddenly bereft. Rival moving cities compete for migration routes, and stationary settlements view them with a mixture of excitement and dread.",
        fields: {
          place_type: "city",
          population: "20,000-100,000",
          trade_role: "major_crossroads",
          accessibility: "difficult",
          terrain_description: "The city itself is the terrain \u2014 a multi-leveled urban platform that moves across the landscape. Structures are built to absorb vibration and tilt. Docking ramps extend during stops for trade. The ground beneath the city's path is permanently scarred by its passage \u2014 compacted earth, crushed vegetation, and deep track-marks.",
          resources: "The city harvests resources from the regions it passes through \u2014 timber, water, game, and mana from ley lines it crosses. Onboard gardens and rainwater collection supplement external harvesting. The moving city's primary resource is its mobility \u2014 it goes where the resources are."
        }
      },
      {
        id: "prison_island",
        name: "Prison Island",
        description: "A remote island for exiles, now a civilization of its own.",
        element_type: "village",
        summary: "Once a prison colony, now a fiercely independent society built by generations of exiles",
        detailed_notes: "Prison Island began as a dumping ground \u2014 a remote, inhospitable island where civilizations sent their criminals, political dissidents, and undesirables. Cut off from the mainland with no means of return, the exiles were expected to die. Instead, they survived, organized, and over generations built a society from nothing. The island civilization is shaped by its origins: fiercely egalitarian (no one claims superiority when everyone is an exile's descendant), deeply pragmatic (survival demanded practical skills above all), and profoundly suspicious of external authority. The island has developed its own language, customs, and legal system \u2014 one notably more merciful than the civilizations that created the prison colony. Mainland nations now find themselves dealing with an independent polity they never intended to create, and the island's strategic maritime position gives it leverage far beyond its small population.",
        fields: {
          place_type: "village",
          population: "2,000-8,000",
          trade_role: "minor_stop",
          accessibility: "remote",
          terrain_description: "A rocky, windswept island with harsh cliffs on the seaward side and a sheltered bay on the leeward. The original prison structures \u2014 stone walls, watchtowers \u2014 have been repurposed as communal buildings. Terraced gardens climb the hillsides. A modest harbor services fishing boats and the occasional trade vessel.",
          resources: "Fish, seabirds, salt, and whatever can be coaxed from thin volcanic soil. The island's strategic position along maritime trade routes is its most valuable asset. Salvage from shipwrecks supplements material needs."
        }
      },
      {
        id: "vertical_city",
        name: "Vertical City",
        description: "Built into a cliff face or ravine. Hundreds of levels, no flat ground.",
        element_type: "city",
        summary: "A city built vertically into a cliff face \u2014 hundreds of levels, no flat ground, life lived in three dimensions",
        detailed_notes: 'The Vertical City clings to the face of an enormous cliff or fills a deep ravine from top to bottom. There is no flat ground \u2014 every surface is a wall, a ledge, or a staircase. Buildings are carved into the rock face or cantilevered out over the void on reinforced platforms. Transportation is vertical: rope lifts, pulley systems, enchanted platforms, and carved staircases connect the hundreds of levels. Social stratification is literally vertical \u2014 the wealthy live at the top where sunlight reaches, the poor at the bottom in perpetual shadow. The city developed in this extreme location because the cliff provided natural defense, the rock contained valuable minerals, or flat land was unavailable. Its inhabitants are as comfortable climbing as walking and have a culture shaped by verticality: status is "high" or "low" in the most literal sense, falling is the primary cause of death, and the concept of "horizon" is purely theoretical to most residents.',
        fields: {
          place_type: "city",
          population: "15,000-60,000",
          trade_role: "regional_hub",
          accessibility: "difficult",
          terrain_description: "Carved into and protruding from a massive cliff face or deep ravine. Hundreds of levels connected by staircases, rope bridges, and pulley-lifts. Buildings are terraced, cantilevered, or tunneled into the rock. Waterfalls cascade down the cliff through the city, powering mills and providing water. The bottom levels are shadowed and damp; the top levels catch wind and sun.",
          resources: "Minerals and stone from the cliff itself. Water from mountain springs and rainfall channeled through carved aqueducts. Limited agriculture on terraced ledges \u2014 mostly vertical gardens and mushroom cultivation in interior caves. Trade goods hauled up from the base by lift systems."
        }
      },
      {
        id: "ancient_ruin",
        name: "Ancient Ruin",
        description: "The crumbling remains of a lost civilization's greatest works.",
        element_type: "ruin",
        summary: "A haunting remnant of a fallen civilization, half-buried and waiting to be rediscovered",
        fields: {
          place_type: "ruin",
          population: "Uninhabited \u2014 perhaps a few scavengers or scholars camped in the outer structures",
          trade_role: "isolated",
          accessibility: "difficult",
          terrain_description: "Massive stone foundations and shattered columns rise from overgrown earth. The original layout suggests a city or fortress of enormous scale. Underground chambers remain partially sealed, their contents unknown.",
          resources: "Ancient artifacts, forgotten knowledge, and building materials for those willing to brave the dangers. Adventurers and scholars are drawn by rumor and legend."
        }
      },
      {
        id: "harbor_city",
        name: "Harbor City",
        description: "A coastal city whose wealth and culture flow from maritime trade.",
        element_type: "port",
        summary: "A bustling coastal city built around its harbor, where ships and cultures converge",
        fields: {
          place_type: "port",
          population: "20,000-200,000",
          trade_role: "major_crossroads",
          accessibility: "accessible",
          terrain_description: "A crescent of city wrapped around a natural deep-water harbor. Wharves and warehouses crowd the waterfront, while merchant quarters and civic buildings climb the hills behind. A seawall or breakwater protects the anchorage from storms.",
          resources: "Fish, salt, and naval stores locally. The true wealth is in tariffs and trade \u2014 goods from across the known world pass through the harbor and are taxed, warehoused, and redistributed inland."
        }
      },
      {
        id: "sacred_site",
        name: "Sacred Site",
        description: "A place of profound spiritual power \u2014 temple, grove, or nexus point.",
        element_type: "temple",
        summary: "A place where the divine feels close and pilgrims gather to seek blessings or answers",
        fields: {
          place_type: "temple",
          population: "A resident priesthood of 50-500, with seasonal influxes of thousands of pilgrims",
          trade_role: "minor_stop",
          accessibility: "moderate",
          terrain_description: "A site of natural beauty or strangeness \u2014 a mountain peak, a spring-fed grove, a cave where light behaves oddly. Structures built by the faithful surround or incorporate the natural feature without obscuring it.",
          resources: "Pilgrim offerings sustain the site economically. The true resource is spiritual \u2014 healing, prophecy, communion with the divine, or access to magical power that exists nowhere else."
        }
      }
    ],
    defaultSortField: "place_type"
  };

  // src/domains/custom.ts
  var customConfig = {
    id: "custom",
    name: "Custom Element",
    namePlural: "Custom Elements",
    icon: "puzzle",
    color: "#bdc3c7",
    description: "Create world elements that don't fit neatly into any other domain. Custom elements store their data as flexible JSON properties, letting you define whatever structure your world needs\u2014unique systems, hybrid concepts, or entirely novel categories.",
    tableName: "world_elements",
    category: "meta",
    fields: [
      {
        name: "properties",
        label: "Properties",
        type: "json",
        placeholder: '{"key": "value"}',
        helpText: "A flexible JSON object for storing any structured data. Define whatever fields your custom element needs."
      }
    ],
    elementTypes: ["custom"],
    elementTypeDescriptions: {
      custom: "A freeform element for anything that doesn't fit the other domains. Define your own structure using flexible properties."
    },
    prompts: [
      "What aspect of your world doesn't fit into the existing domains? Consider unique systems, hybrid concepts, or entirely new categories that make your world distinct.",
      "How does this custom element connect to the rest of your world? Even unique concepts gain depth when they interact with established systems like magic, ecology, or civilization."
    ],
    magicPermeation: null,
    archetypes: [
      {
        id: "language_system",
        name: "Constructed Language",
        description: "Define a language with phonology, grammar, and script.",
        element_type: "custom",
        summary: "A fully constructed language with its own sounds, grammar, writing system, and cultural context",
        detailed_notes: "A constructed language (conlang) is one of the deepest acts of world-building. Language shapes thought, and a well-designed conlang reveals how its speakers perceive and categorize reality. Does the language have tenses for past and future, or does it treat time differently? Are there gendered nouns, or is gender irrelevant to grammar? How many words exist for concepts central to the culture \u2014 a seafaring people might have dozens of words for water, while a desert culture has dozens for sand. The writing system encodes cultural values: is it efficient (alphabetic) or beautiful (calligraphic)? Is literacy widespread or restricted? The phonology \u2014 the sounds of the language \u2014 determines its aesthetic: harsh consonant clusters for a warrior culture, flowing vowels for a poetic one.",
        fields: {
          properties: {
            phonology: "Define the sound inventory \u2014 consonants, vowels, tones, and phonotactic rules (which sounds can appear where)",
            grammar: "Define word order, case systems, verb conjugation, noun declension, and any unique grammatical features",
            script: "Define the writing system \u2014 alphabet, syllabary, logographic, or other. Include directionality and medium (ink, carving, etc.)",
            example_phrases: "Provide sample phrases with translations to demonstrate the language in action"
          }
        }
      },
      {
        id: "religion_system",
        name: "Religious System",
        description: "A belief system with deities, cosmology, rituals, and clergy.",
        element_type: "custom",
        summary: "A complete religious system with gods, creation myths, sacred rituals, and organized clergy",
        detailed_notes: "A religious system is more than a list of gods \u2014 it is a comprehensive framework for understanding existence. It answers the questions every culture asks: Where did we come from? Why do we suffer? What happens when we die? What must we do to live rightly? The answers shape laws, art, architecture, warfare, and daily life. A well-designed religion includes internal tensions \u2014 orthodoxy versus heresy, clergy versus laity, faith versus doubt \u2014 because living religions are never monolithic. Consider whether the gods are real, distant, or imaginary within your world, and how that affects the religion's credibility and power. Think about schisms, reformations, and how the religion has changed over time.",
        fields: {
          properties: {
            deities: "List and describe the gods, spirits, or divine forces \u2014 their domains, personalities, relationships, and how they interact with mortals",
            creation_myth: "The story of how the world began according to this religion \u2014 and how it may end",
            rituals: "Key religious practices \u2014 daily prayers, seasonal festivals, life-transition ceremonies, sacrifices, and pilgrimages",
            clergy_structure: "The organization of religious authority \u2014 priests, monks, oracles, hierarchies, training, and the relationship between clergy and secular power"
          }
        }
      },
      {
        id: "economic_system",
        name: "Economic System",
        description: "Trade, currency, taxation, and resource distribution.",
        element_type: "custom",
        summary: "A complete economic framework covering currency, trade, taxation, and how wealth flows through society",
        detailed_notes: "An economic system determines who has power, who has comfort, and who has nothing. It encompasses everything from the medium of exchange (metal coins, mana crystals, barter, debt-tokens) to the rules governing trade (free markets, guild monopolies, state control), taxation (what is taxed, at what rate, and who collects), and the distribution of resources (equitable, feudal, plutocratic). The economic system intersects with magic in critical ways: if magic can create food, what happens to farmers? If enchantment is a trade, who regulates quality? If mana is a resource, who owns the ley lines? Economic systems create winners and losers, and the tension between them drives much of a world's conflict.",
        fields: {
          properties: {
            currency: "The medium of exchange \u2014 what it is, how it is minted or produced, and what backs its value",
            trade_goods: "The major commodities traded \u2014 raw materials, finished goods, magical services, and luxury items",
            taxation: "How the state extracts wealth \u2014 what is taxed, at what rates, and how compliance is enforced",
            markets: "How trade is organized \u2014 free markets, guild halls, auction houses, state exchanges, and black markets"
          }
        }
      },
      {
        id: "calendar_system",
        name: "Calendar System",
        description: "Timekeeping with months, weeks, holidays, astronomical basis.",
        element_type: "custom",
        summary: "A timekeeping system defining how a civilization measures days, seasons, and the passage of years",
        detailed_notes: "A calendar system reflects a civilization's relationship with time, the cosmos, and what it considers important enough to commemorate. The structure may be based on astronomical observations (solar years, lunar months, stellar cycles), magical cycles (mana tides, ley line pulses, planar alignments), or arbitrary cultural conventions. The names of months and days carry meaning \u2014 named for gods, heroes, seasons, or historical events. Holidays mark the moments a culture pauses to remember, celebrate, or mourn. The calendar is also a tool of power: whoever defines the calendar defines the rhythm of daily life, the timing of religious observance, and the framework within which history is recorded. Rival calendars represent rival claims to cultural authority.",
        fields: {
          properties: {
            year_length: "The length of a year and what astronomical or magical cycle it is based on",
            months: "The months of the year \u2014 their names, lengths, and seasonal associations",
            weeks: "The structure of weeks \u2014 how many days, their names, and which are rest days or market days",
            holidays: "Major holidays and observances \u2014 what they commemorate, how they are celebrated, and their cultural significance"
          }
        }
      }
    ],
    defaultSortField: "name"
  };

  // src/domains/index.ts
  var ALL_DOMAINS = [
    cosmologyConfig,
    geologyConfig,
    hydrologyConfig,
    atmosphereConfig,
    climateConfig,
    biomesConfig,
    floraConfig,
    faunaConfig,
    ecosystemsConfig,
    sentientSpeciesConfig,
    civilizationsConfig,
    culturesConfig,
    magicSystemsConfig,
    planarSystemsConfig,
    arcaneSciencesConfig,
    magicEcologyConfig,
    magicEconomyConfig,
    historyConfig,
    geographyConfig,
    customConfig
  ];
  var DOMAIN_MAP = new Map(
    ALL_DOMAINS.map((d) => [d.id, d])
  );
  var DOMAIN_CATEGORIES = {
    natural: ALL_DOMAINS.filter((d) => d.category === "natural"),
    sentient: ALL_DOMAINS.filter((d) => d.category === "sentient"),
    magic: ALL_DOMAINS.filter((d) => d.category === "magic"),
    meta: ALL_DOMAINS.filter((d) => d.category === "meta")
  };
  function getDomainConfig(id) {
    return DOMAIN_MAP.get(id);
  }

  // src/blueprints/index.ts
  var ALL_BLUEPRINTS = [
    // --- Fantasy ---
    {
      id: "high_fantasy",
      name: "High Fantasy Realm",
      description: "A classic high-magic world of diverse peoples, ancient forests, feudal kingdoms, and dragons. Elves and dwarves rub shoulders with human empires, and magic permeates every layer of society.",
      icon: "crown",
      color: "#e8c547",
      tags: ["fantasy", "classic", "magic"],
      magic: true,
      suggestions: [
        { domain: "cosmology", archetypeId: "habitable_planet", priority: "essential", note: "The material world where the story takes place" },
        { domain: "geology", archetypeId: "continental_mountain_range", priority: "recommended", note: "Mountain ranges divide kingdoms and hide ancient secrets" },
        { domain: "biomes", archetypeId: "temperate_forest", priority: "recommended", note: "Ancient forests are the heartland of elven civilizations" },
        { domain: "flora", archetypeId: "ancient_hardwood", priority: "optional", note: "Millennial trees form the backbone of old-growth forests" },
        { domain: "fauna", archetypeId: "apex_predator", priority: "optional", note: "Great beasts roam the wild places between kingdoms" },
        { domain: "fauna", archetypeId: "beast_of_burden", priority: "optional", note: "Horses, oxen, or their equivalents power civilization" },
        { domain: "sentient_species", archetypeId: "baseline_humanoid", priority: "essential", note: "Humans form the most numerous and adaptable species" },
        { domain: "sentient_species", archetypeId: "long_lived_elven", priority: "recommended", note: "Long-lived elves bring ancient perspective" },
        { domain: "sentient_species", archetypeId: "hardy_mountain_folk", priority: "recommended", note: "Dwarves anchor the mountains and underground" },
        { domain: "civilizations", archetypeId: "feudal_kingdom", priority: "essential", note: "The dominant political structure of the realm" },
        { domain: "cultures", archetypeId: "warrior_honor", priority: "recommended", note: "Knightly honor codes shape the ruling class" },
        { domain: "magic_systems", archetypeId: "elemental_taxonomy", priority: "essential", note: "Magic organized into classical elemental schools" },
        { domain: "magic_systems", archetypeId: "apprentice_to_archmage", priority: "recommended", note: "Structured magical education and progression" },
        { domain: "history", archetypeId: "great_war", priority: "optional", note: "A defining conflict that shaped the current political map" }
      ]
    },
    {
      id: "dark_fantasy",
      name: "Dark Fantasy",
      description: "A grim world where magic comes at terrible cost, the dead don't rest easy, and corruption seeps from the planes. Hope is precious because it's so rare.",
      icon: "skull",
      color: "#6b21a8",
      tags: ["fantasy", "horror", "grim"],
      magic: true,
      suggestions: [
        { domain: "cosmology", archetypeId: "dying_god_star", priority: "recommended", note: "Even the stars are dying \u2014 sets the tone" },
        { domain: "climate", archetypeId: "polar_tundra", priority: "optional", note: "Harsh, unforgiving climate matches the mood" },
        { domain: "biomes", archetypeId: "deep_cavern", priority: "optional", note: "Darkness below mirrors darkness above" },
        { domain: "flora", archetypeId: "corpse_bloom", priority: "optional", note: "Beauty growing from death" },
        { domain: "fauna", archetypeId: "deep_sea_leviathan", priority: "optional", note: "Ancient terrors lurking in the deep" },
        { domain: "ecosystems", archetypeId: "war_scarred", priority: "recommended", note: "Landscapes still recovering from past horrors" },
        { domain: "sentient_species", archetypeId: "baseline_humanoid", priority: "essential", note: "Fragile humans struggling to survive" },
        { domain: "civilizations", archetypeId: "necrocracy", priority: "recommended", note: "The dead rule \u2014 the ultimate dark authority" },
        { domain: "cultures", archetypeId: "death_celebrants", priority: "optional", note: "A culture shaped by the omnipresence of death" },
        { domain: "magic_systems", archetypeId: "soul_cost", priority: "essential", note: "Magic eats the caster alive" },
        { domain: "magic_systems", archetypeId: "forbidden_spell", priority: "recommended", note: "Forbidden workings tempt the desperate" },
        { domain: "planar_systems", archetypeId: "shadow_realm", priority: "recommended", note: "A shadow plane bleeds into reality" },
        { domain: "history", archetypeId: "the_sundering", priority: "optional", note: "A cataclysm that broke the world" }
      ]
    },
    {
      id: "oceanic_world",
      name: "Oceanic World",
      description: "A world dominated by vast oceans with scattered island chains, reef civilizations, and mysteries in the deep. Land is precious, and the sea is everything.",
      icon: "waves",
      color: "#0891b2",
      tags: ["fantasy", "exploration", "maritime"],
      magic: true,
      suggestions: [
        { domain: "cosmology", archetypeId: "habitable_planet", priority: "essential", note: "A water-heavy world with minimal landmass" },
        { domain: "geology", archetypeId: "shield_volcano", priority: "recommended", note: "Volcanic islands are the primary land" },
        { domain: "hydrology", archetypeId: "major_ocean", priority: "essential", note: "The defining feature of this world" },
        { domain: "hydrology", archetypeId: "coastal_wetlands", priority: "optional", note: "Precious coastal ecosystems where land meets sea" },
        { domain: "climate", archetypeId: "tropical_monsoon", priority: "recommended", note: "Tropical maritime climate shapes life" },
        { domain: "biomes", archetypeId: "coral_reef_biome", priority: "essential", note: "Coral reefs are the forests of this world" },
        { domain: "flora", archetypeId: "dreaming_lotus", priority: "optional", note: "Mystical aquatic plants" },
        { domain: "fauna", archetypeId: "deep_sea_leviathan", priority: "recommended", note: "Leviathans rule the deep ocean" },
        { domain: "ecosystems", archetypeId: "coral_reef_ecosystem", priority: "essential", note: "Reef ecosystems drive biodiversity" },
        { domain: "sentient_species", archetypeId: "aquatic_people", priority: "essential", note: "Aquatic species dominate this world" },
        { domain: "civilizations", archetypeId: "trading_republic", priority: "recommended", note: "Maritime trade republics thrive" },
        { domain: "cultures", archetypeId: "maritime_voyagers", priority: "essential", note: "Seafaring culture is the default" },
        { domain: "geography", archetypeId: "harbor_city", priority: "recommended", note: "Port cities are the hubs of civilization" }
      ]
    },
    {
      id: "desert_realm",
      name: "Desert Realm",
      description: "A harsh, arid world where water is currency, shade is shelter, and ancient ruins hide beneath the sands. Civilizations cluster around oases and underground rivers.",
      icon: "sun",
      color: "#d97706",
      tags: ["fantasy", "survival", "ancient"],
      magic: true,
      suggestions: [
        { domain: "geology", archetypeId: "rift_valley", priority: "optional", note: "Rift valleys provide water and shelter in the wastes" },
        { domain: "geology", archetypeId: "glass_desert", priority: "recommended", note: "A glassed wasteland hints at ancient catastrophe" },
        { domain: "hydrology", archetypeId: "alpine_lake", priority: "optional", note: "Rare oasis lakes are the basis of civilization" },
        { domain: "atmosphere", archetypeId: "earth_like", priority: "essential", note: "Breathable but brutally hot and dry" },
        { domain: "climate", archetypeId: "arid_desert", priority: "essential", note: "The defining climate of the realm" },
        { domain: "biomes", archetypeId: "arid_desert_biome", priority: "essential", note: "Desert biomes cover most of the world" },
        { domain: "flora", archetypeId: "medicinal_herb", priority: "optional", note: "Desert herbs are rare and valuable" },
        { domain: "fauna", archetypeId: "migratory_herder", priority: "optional", note: "Herds follow seasonal water sources" },
        { domain: "sentient_species", archetypeId: "baseline_humanoid", priority: "essential", note: "Hardy desert peoples" },
        { domain: "civilizations", archetypeId: "nomadic_confederation", priority: "essential", note: "Nomadic peoples follow water and trade" },
        { domain: "civilizations", archetypeId: "theocratic_empire", priority: "recommended", note: "Oasis cities grow into theocratic powers" },
        { domain: "geography", archetypeId: "crossroads_town", priority: "recommended", note: "Trade crossroads between oases" },
        { domain: "history", archetypeId: "great_war", priority: "optional", note: "Water wars shaped the current order" }
      ]
    },
    {
      id: "underground_world",
      name: "Underground World",
      description: "Life beneath the surface \u2014 vast cavern cities, fungal forests, underground seas, and civilizations that have never seen the sky. Darkness is home.",
      icon: "mountain",
      color: "#78716c",
      tags: ["fantasy", "subterranean", "alien"],
      magic: true,
      suggestions: [
        { domain: "geology", archetypeId: "limestone_cave_network", priority: "essential", note: "Vast cave systems form the living space" },
        { domain: "hydrology", archetypeId: "underground_ocean", priority: "essential", note: "Underground oceans provide water and transport" },
        { domain: "biomes", archetypeId: "deep_cavern", priority: "essential", note: "Cavern biomes sustained by chemosynthesis" },
        { domain: "biomes", archetypeId: "inverted_canopy", priority: "recommended", note: "Forests growing from cavern ceilings" },
        { domain: "flora", archetypeId: "cave_fungus", priority: "essential", note: "Bioluminescent fungi provide light and food" },
        { domain: "fauna", archetypeId: "colonial_insect", priority: "recommended", note: "Eusocial insects thrive in the dark" },
        { domain: "ecosystems", archetypeId: "hydrothermal_vent", priority: "recommended", note: "Geothermal vents power deep ecosystems" },
        { domain: "sentient_species", archetypeId: "hardy_mountain_folk", priority: "essential", note: "Species adapted to darkness and stone" },
        { domain: "sentient_species", archetypeId: "fungal_collective", priority: "optional", note: "Fungal intelligence thrives underground" },
        { domain: "civilizations", archetypeId: "underground_empire", priority: "essential", note: "Great cities carved from living rock" },
        { domain: "geography", archetypeId: "ancient_ruin", priority: "optional", note: "Ruins of deeper, older civilizations below" },
        { domain: "magic_systems", archetypeId: "mana_crystal", priority: "recommended", note: "Crystal deposits fuel underground magic" }
      ]
    },
    // --- Environmental Extremes ---
    {
      id: "frozen_wastes",
      name: "Frozen Wastes",
      description: "An ice-bound world where glaciers grind, blizzards howl, and warmth is the most precious resource. Civilizations huddle around geothermal vents and hot springs.",
      icon: "snowflake",
      color: "#7dd3fc",
      tags: ["survival", "harsh", "arctic"],
      magic: true,
      suggestions: [
        { domain: "hydrology", archetypeId: "frozen_highway", priority: "recommended", note: "Frozen rivers serve as highways" },
        { domain: "climate", archetypeId: "polar_tundra", priority: "essential", note: "Polar climate dominates" },
        { domain: "biomes", archetypeId: "arid_desert_biome", priority: "optional", note: "Cold deserts of ice and rock" },
        { domain: "flora", archetypeId: "medicinal_herb", priority: "optional", note: "Hardy arctic plants with potent properties" },
        { domain: "fauna", archetypeId: "apex_predator", priority: "recommended", note: "Ice predators are apex survivors" },
        { domain: "fauna", archetypeId: "migratory_herder", priority: "recommended", note: "Herds migrate with the brief summer" },
        { domain: "sentient_species", archetypeId: "hardy_mountain_folk", priority: "essential", note: "Stocky, cold-adapted peoples" },
        { domain: "civilizations", archetypeId: "nomadic_confederation", priority: "recommended", note: "Nomadic peoples follow game and warmth" },
        { domain: "cultures", archetypeId: "nomadic_storytellers", priority: "optional", note: "Oral traditions survive the long dark" },
        { domain: "geography", archetypeId: "forbidden_zone", priority: "optional", note: "The deep ice is too deadly to enter" }
      ]
    },
    {
      id: "sky_realm",
      name: "Sky Realm",
      description: "A world of floating islands, cloud forests, and bottomless sky. Civilizations build on drifting rock, and falling is the ultimate fear.",
      icon: "cloud",
      color: "#38bdf8",
      tags: ["fantasy", "aerial", "vertical"],
      magic: true,
      suggestions: [
        { domain: "geology", archetypeId: "floating_islands", priority: "essential", note: "Floating rock masses are the only land" },
        { domain: "atmosphere", archetypeId: "layered_breathability", priority: "recommended", note: "Breathable only at certain altitudes" },
        { domain: "atmosphere", archetypeId: "singing_winds", priority: "optional", note: "Winds sing through crystal formations" },
        { domain: "biomes", archetypeId: "floating_reef", priority: "essential", note: "Sky reef ecosystems on floating debris" },
        { domain: "fauna", archetypeId: "sky_whale", priority: "essential", note: "Sky whales drift between islands" },
        { domain: "ecosystems", archetypeId: "parasitic_network", priority: "optional", note: "Aerial parasitic networks connect drifting life" },
        { domain: "sentient_species", archetypeId: "baseline_humanoid", priority: "essential", note: "Sky-adapted peoples" },
        { domain: "civilizations", archetypeId: "isolated_city_state", priority: "recommended", note: "Each island is its own city-state" },
        { domain: "geography", archetypeId: "sky_port", priority: "essential", note: "Sky ports connect the floating world" },
        { domain: "magic_systems", archetypeId: "ambient_field", priority: "recommended", note: "Ambient mana keeps the islands aloft" }
      ]
    },
    {
      id: "volcanic_world",
      name: "Primordial World",
      description: "A young, raw world of active volcanoes, lava rivers, and violent geology. Life is tough, new, and evolving fast. The ground itself is still being born.",
      icon: "flame",
      color: "#ef4444",
      tags: ["primal", "dangerous", "young"],
      magic: true,
      suggestions: [
        { domain: "geology", archetypeId: "shield_volcano", priority: "essential", note: "Active volcanoes shape the landscape" },
        { domain: "geology", archetypeId: "rift_valley", priority: "recommended", note: "Rifts tear the young crust apart" },
        { domain: "hydrology", archetypeId: "major_ocean", priority: "recommended", note: "Steaming primordial oceans" },
        { domain: "atmosphere", archetypeId: "thick_greenhouse", priority: "optional", note: "Dense, volcanic atmosphere" },
        { domain: "biomes", archetypeId: "crystalline_waste", priority: "optional", note: "Mineral biomes in extreme heat" },
        { domain: "flora", archetypeId: "iron_root", priority: "optional", note: "Metal-extracting plants thrive on mineral-rich soil" },
        { domain: "ecosystems", archetypeId: "hydrothermal_vent", priority: "essential", note: "Vent ecosystems are the cradle of life" },
        { domain: "sentient_species", archetypeId: "living_statues", priority: "optional", note: "Silicon-based life in extreme heat" },
        { domain: "civilizations", archetypeId: "nomadic_confederation", priority: "recommended", note: "Nomadic peoples avoid eruption zones" },
        { domain: "magic_ecology", archetypeId: "geological_mana", priority: "optional", note: "Mana wells up through volcanic processes" }
      ]
    },
    // --- Conceptual/Strange ---
    {
      id: "dying_world",
      name: "Dying World",
      description: "A world in ecological and magical collapse. Resources are dwindling, magic is fading, and every civilization is desperate. The end is coming \u2014 but when?",
      icon: "hourglass",
      color: "#a3a3a3",
      tags: ["grim", "decline", "survival"],
      magic: true,
      suggestions: [
        { domain: "cosmology", archetypeId: "dying_god_star", priority: "recommended", note: "Even the star is failing" },
        { domain: "climate", archetypeId: "arid_desert", priority: "recommended", note: "Climate shifting toward arid death" },
        { domain: "ecosystems", archetypeId: "war_scarred", priority: "essential", note: "Ecosystems collapsing everywhere" },
        { domain: "fauna", archetypeId: "living_fossil", priority: "optional", note: "Ancient survivors from better times" },
        { domain: "sentient_species", archetypeId: "baseline_humanoid", priority: "essential", note: "Desperate peoples clinging to survival" },
        { domain: "civilizations", archetypeId: "isolated_city_state", priority: "recommended", note: "Isolated cities hoarding last resources" },
        { domain: "magic_systems", archetypeId: "soul_cost", priority: "recommended", note: "Magic exacts ever-steeper costs" },
        { domain: "magic_ecology", archetypeId: "mana_desert", priority: "essential", note: "Mana dead zones spreading across the world" },
        { domain: "magic_economy", archetypeId: "mana_debt", priority: "optional", note: "Magical debts coming due all at once" },
        { domain: "history", archetypeId: "the_sundering", priority: "recommended", note: "The cataclysm that started the decline" },
        { domain: "geography", archetypeId: "forbidden_zone", priority: "optional", note: "Dead zones where nothing survives" }
      ]
    },
    {
      id: "planar_crossroads",
      name: "Planar Crossroads",
      description: "A world where the barriers between planes are thin. Extraplanar creatures walk the streets, portals open without warning, and reality is negotiable.",
      icon: "git-branch",
      color: "#a855f7",
      tags: ["fantasy", "planar", "chaotic"],
      magic: true,
      suggestions: [
        { domain: "cosmology", archetypeId: "habitable_planet", priority: "essential", note: "The material plane \u2014 thin-skinned and leaking" },
        { domain: "planar_systems", archetypeId: "material_plane", priority: "essential", note: "The anchor plane, but weakened" },
        { domain: "planar_systems", archetypeId: "elemental_bastion", priority: "recommended", note: "Elemental planes bleeding through" },
        { domain: "planar_systems", archetypeId: "fey_wild", priority: "recommended", note: "The Fey realm overlaps with forests" },
        { domain: "planar_systems", archetypeId: "shadow_realm", priority: "recommended", note: "Shadow plane visible at night" },
        { domain: "planar_systems", archetypeId: "bleeding_wound", priority: "essential", note: "Planar wounds where realities merge" },
        { domain: "magic_systems", archetypeId: "wild_surge", priority: "essential", note: "Wild magic surges from planar interference" },
        { domain: "magic_ecology", archetypeId: "ley_line_nexus", priority: "recommended", note: "Ley line nexuses mark thin spots" },
        { domain: "sentient_species", archetypeId: "phase_beings", priority: "optional", note: "Phase beings slip between planes" },
        { domain: "fauna", archetypeId: "mimic_predator", priority: "optional", note: "Extraplanar predators disguise as terrain" },
        { domain: "geography", archetypeId: "crossroads_town", priority: "recommended", note: "Trade towns at stable portal sites" }
      ]
    },
    {
      id: "archipelago",
      name: "Archipelago",
      description: "A world of island chains \u2014 each island its own culture, ecosystem, and mystery. Navigation is survival, and the spaces between islands are as important as the land.",
      icon: "compass",
      color: "#14b8a6",
      tags: ["exploration", "maritime", "diverse"],
      magic: true,
      suggestions: [
        { domain: "geology", archetypeId: "shield_volcano", priority: "recommended", note: "Volcanic islands form the archipelago" },
        { domain: "hydrology", archetypeId: "major_ocean", priority: "essential", note: "Ocean dominates between islands" },
        { domain: "hydrology", archetypeId: "coastal_wetlands", priority: "optional", note: "Mangroves and tidal flats ring the islands" },
        { domain: "climate", archetypeId: "tropical_monsoon", priority: "recommended", note: "Tropical climate across the chain" },
        { domain: "biomes", archetypeId: "tropical_rainforest", priority: "recommended", note: "Dense tropical forests on larger islands" },
        { domain: "biomes", archetypeId: "coral_reef_biome", priority: "essential", note: "Reefs connect the islands underwater" },
        { domain: "ecosystems", archetypeId: "coral_reef_ecosystem", priority: "recommended", note: "Rich reef ecosystems" },
        { domain: "sentient_species", archetypeId: "baseline_humanoid", priority: "essential", note: "Island peoples" },
        { domain: "civilizations", archetypeId: "isolated_city_state", priority: "essential", note: "Each island is self-governing" },
        { domain: "civilizations", archetypeId: "pirate_republic", priority: "optional", note: "Pirate havens among the outer islands" },
        { domain: "cultures", archetypeId: "maritime_voyagers", priority: "essential", note: "Seafaring is the core cultural skill" },
        { domain: "geography", archetypeId: "harbor_city", priority: "recommended", note: "Every major settlement is a port" }
      ]
    },
    {
      id: "magical_industrial",
      name: "Magical Industrial",
      description: "A world where magic and technology have merged into magitech industry. Enchanted factories, spell-powered transit, and the social upheaval of a magical industrial revolution.",
      icon: "cog",
      color: "#f59e0b",
      tags: ["magitech", "urban", "progress"],
      magic: true,
      suggestions: [
        { domain: "sentient_species", archetypeId: "baseline_humanoid", priority: "essential", note: "The innovating species" },
        { domain: "civilizations", archetypeId: "trading_republic", priority: "essential", note: "Merchant power drives innovation" },
        { domain: "cultures", archetypeId: "scholarly_tradition", priority: "recommended", note: "Academic traditions fuel research" },
        { domain: "geography", archetypeId: "capital_city", priority: "essential", note: "Great cities are the engines of progress" },
        { domain: "magic_systems", archetypeId: "mana_crystal", priority: "essential", note: "Mana crystals fuel the industrial machine" },
        { domain: "magic_systems", archetypeId: "runic_system", priority: "recommended", note: "Runic inscriptions power enchanted devices" },
        { domain: "arcane_sciences", archetypeId: "communication_crystal", priority: "recommended", note: "Magical communication networks" },
        { domain: "arcane_sciences", archetypeId: "golem_workforce", priority: "essential", note: "Golem labor replaces human workers" },
        { domain: "arcane_sciences", archetypeId: "spell_telegraph", priority: "recommended", note: "Instant communication across distances" },
        { domain: "magic_economy", archetypeId: "enchanter_guild", priority: "essential", note: "Guilds control the magical economy" },
        { domain: "magic_economy", archetypeId: "mana_currency", priority: "optional", note: "Mana becomes the medium of exchange" },
        { domain: "magic_ecology", archetypeId: "ley_line_nexus", priority: "optional", note: "Cities built on ley line nexuses for power" }
      ]
    },
    {
      id: "mythic_world",
      name: "Mythic World",
      description: "Gods walk the earth, mythical beasts are real, and mortal deeds echo in the divine realm. This is a world of legends being written in real time.",
      icon: "zap",
      color: "#eab308",
      tags: ["mythic", "divine", "epic"],
      magic: true,
      suggestions: [
        { domain: "cosmology", archetypeId: "dying_god_star", priority: "optional", note: "Stars as divine corpses or eyes" },
        { domain: "fauna", archetypeId: "deep_sea_leviathan", priority: "recommended", note: "Titanic beasts of legend" },
        { domain: "fauna", archetypeId: "sky_whale", priority: "optional", note: "Sky whales as divine messengers" },
        { domain: "sentient_species", archetypeId: "baseline_humanoid", priority: "essential", note: "Mortals caught between gods" },
        { domain: "civilizations", archetypeId: "theocratic_empire", priority: "essential", note: "Theocracies serve the gods directly" },
        { domain: "cultures", archetypeId: "death_celebrants", priority: "optional", note: "Death rites connect to the divine" },
        { domain: "magic_systems", archetypeId: "divine_gift", priority: "essential", note: "All magic comes from the gods" },
        { domain: "planar_systems", archetypeId: "divine_domain", priority: "essential", note: "Gods reside in their own planes" },
        { domain: "history", archetypeId: "great_war", priority: "recommended", note: "Divine wars shaped the world" },
        { domain: "history", archetypeId: "founding_nation", priority: "recommended", note: "Nations founded by divine mandate" },
        { domain: "geography", archetypeId: "sacred_site", priority: "essential", note: "Temples and holy sites dot the land" }
      ]
    },
    {
      id: "pastoral",
      name: "Pastoral",
      description: "A peaceful, gentle world of rolling farmland, cozy villages, and kind folk. Conflict is personal, not apocalyptic. The beauty is in the everyday.",
      icon: "flower-2",
      color: "#22c55e",
      tags: ["peaceful", "rural", "cozy"],
      magic: false,
      suggestions: [
        { domain: "climate", archetypeId: "temperate_maritime", priority: "essential", note: "Mild, pleasant climate" },
        { domain: "biomes", archetypeId: "temperate_forest", priority: "recommended", note: "Gentle forests and meadows" },
        { domain: "flora", archetypeId: "staple_grain", priority: "essential", note: "Agriculture is the foundation of life" },
        { domain: "flora", archetypeId: "ancient_hardwood", priority: "optional", note: "Ancient trees shade village greens" },
        { domain: "fauna", archetypeId: "beast_of_burden", priority: "essential", note: "Farm animals and companions" },
        { domain: "ecosystems", archetypeId: "old_growth_forest", priority: "optional", note: "Undisturbed old-growth woodlands" },
        { domain: "ecosystems", archetypeId: "freshwater_wetland", priority: "optional", note: "Ponds and marshes teeming with life" },
        { domain: "sentient_species", archetypeId: "baseline_humanoid", priority: "essential", note: "Simple, good folk" },
        { domain: "civilizations", archetypeId: "feudal_kingdom", priority: "recommended", note: "A benevolent monarchy" },
        { domain: "cultures", archetypeId: "agrarian_folk", priority: "essential", note: "Farming communities with harvest festivals" },
        { domain: "geography", archetypeId: "crossroads_town", priority: "recommended", note: "Bustling market towns" }
      ]
    },
    // --- Weird/Unique ---
    {
      id: "hollow_interior",
      name: "Hollow World",
      description: "Life on the inside of a hollow sphere \u2014 the horizon curves up, not down. The inner sun never sets, and distant lands hang overhead like painted ceiling.",
      icon: "circle",
      color: "#8b5cf6",
      tags: ["alien", "unique", "exploration"],
      magic: true,
      suggestions: [
        { domain: "cosmology", archetypeId: "hollow_world", priority: "essential", note: "The hollow planet itself" },
        { domain: "geology", archetypeId: "continental_mountain_range", priority: "recommended", note: "Mountains on the inner surface reach toward the core" },
        { domain: "atmosphere", archetypeId: "layered_breathability", priority: "optional", note: "Atmosphere thickens toward the core" },
        { domain: "climate", archetypeId: "eternal_twilight", priority: "optional", note: "The inner sun never sets \u2014 eternal day" },
        { domain: "biomes", archetypeId: "tropical_rainforest", priority: "recommended", note: "Lush growth under constant warm light" },
        { domain: "sentient_species", archetypeId: "baseline_humanoid", priority: "essential", note: "Interior peoples unaware of the outside" },
        { domain: "civilizations", archetypeId: "isolated_city_state", priority: "recommended", note: "Isolated communities on the inner surface" },
        { domain: "cultures", archetypeId: "silence_keepers", priority: "optional", note: "A culture of mystery in the hollow" },
        { domain: "magic_systems", archetypeId: "ambient_field", priority: "optional", note: "Mana concentrated inside the shell" }
      ]
    },
    {
      id: "dual_world",
      name: "Dual World",
      description: "A tidally locked planet \u2014 one side faces the star in eternal day, the other in eternal night. The habitable twilight band between them is everything.",
      icon: "contrast",
      color: "#6366f1",
      tags: ["sci-fi", "unique", "divided"],
      magic: false,
      suggestions: [
        { domain: "cosmology", archetypeId: "red_dwarf_star", priority: "essential", note: "Red dwarfs commonly tidally lock their planets" },
        { domain: "cosmology", archetypeId: "habitable_planet", priority: "essential", note: "A tidally locked world" },
        { domain: "climate", archetypeId: "eternal_twilight", priority: "essential", note: "The habitable twilight zone" },
        { domain: "climate", archetypeId: "storm_belt", priority: "recommended", note: "Permanent storm systems at the terminator" },
        { domain: "biomes", archetypeId: "arid_desert_biome", priority: "recommended", note: "The day side is a scorching desert" },
        { domain: "flora", archetypeId: "singing_tree", priority: "optional", note: "Wind-adapted flora in the storm belt" },
        { domain: "sentient_species", archetypeId: "baseline_humanoid", priority: "essential", note: "Peoples adapted to twilight living" },
        { domain: "civilizations", archetypeId: "isolated_city_state", priority: "recommended", note: "Cities along the narrow habitable band" },
        { domain: "geography", archetypeId: "crossroads_town", priority: "recommended", note: "Towns where day-side and night-side trade" }
      ]
    },
    {
      id: "living_world",
      name: "Living World",
      description: "The planet itself is a living organism. Mountains breathe, rivers are veins, earthquakes are heartbeats. Civilizations are parasites, symbionts, or children of the world-body.",
      icon: "heart",
      color: "#10b981",
      tags: ["alien", "organic", "mythic"],
      magic: true,
      suggestions: [
        { domain: "geology", archetypeId: "living_mountain", priority: "essential", note: "Mountains that breathe and shift" },
        { domain: "hydrology", archetypeId: "great_river", priority: "recommended", note: "Rivers as the world's circulatory system" },
        { domain: "biomes", archetypeId: "fungal_jungle", priority: "recommended", note: "Fungal networks as the world's neural tissue" },
        { domain: "flora", archetypeId: "iron_root", priority: "optional", note: "Plants interfacing with the living geology" },
        { domain: "fauna", archetypeId: "symbiotic_pair", priority: "recommended", note: "All life is symbiotic with the world-organism" },
        { domain: "ecosystems", archetypeId: "symbiotic_megaorganism", priority: "essential", note: "The entire world is one superorganism" },
        { domain: "sentient_species", archetypeId: "fungal_collective", priority: "recommended", note: "Fungal minds connected to the world's consciousness" },
        { domain: "magic_systems", archetypeId: "innate_biological", priority: "essential", note: "Magic is the world's life force" },
        { domain: "magic_ecology", archetypeId: "biological_mana", priority: "recommended", note: "Living mana cycles through organisms" },
        { domain: "planar_systems", archetypeId: "living_realm", priority: "optional", note: "The plane IS a living being" }
      ]
    },
    {
      id: "ancient_ruins",
      name: "Ancient Ruins",
      description: "A world built on the bones of a prior civilization. Ruins everywhere, lost technology underground, and modern peoples living among monuments they don't understand.",
      icon: "landmark",
      color: "#b45309",
      tags: ["mystery", "archaeological", "ancient"],
      magic: true,
      suggestions: [
        { domain: "geology", archetypeId: "glass_desert", priority: "optional", note: "Glassed wastelands from ancient weapons" },
        { domain: "ecosystems", archetypeId: "war_scarred", priority: "recommended", note: "Ecosystems recovering from ancient devastation" },
        { domain: "sentient_species", archetypeId: "baseline_humanoid", priority: "essential", note: "Modern peoples in the ruins" },
        { domain: "sentient_species", archetypeId: "constructed_people", priority: "optional", note: "Ancient constructs still wandering" },
        { domain: "civilizations", archetypeId: "feudal_kingdom", priority: "recommended", note: "Medieval civilizations in ancient shells" },
        { domain: "cultures", archetypeId: "scholarly_tradition", priority: "recommended", note: "Scholars trying to decode the ancients" },
        { domain: "geography", archetypeId: "ancient_ruin", priority: "essential", note: "Ruins are the defining feature of the landscape" },
        { domain: "geography", archetypeId: "forbidden_zone", priority: "recommended", note: "Some ruins are too dangerous to enter" },
        { domain: "arcane_sciences", archetypeId: "golem_workforce", priority: "optional", note: "Ancient golems still performing obsolete tasks" },
        { domain: "history", archetypeId: "the_sundering", priority: "essential", note: "The fall of the ancients" },
        { domain: "history", archetypeId: "forbidden_knowledge_event", priority: "recommended", note: "Knowledge of what destroyed them \u2014 suppressed" }
      ]
    },
    {
      id: "elemental_chaos",
      name: "Elemental Chaos",
      description: "Raw elemental forces run rampant. Fire storms, stone waves, water that flows upward. The world is beautiful, deadly, and never still.",
      icon: "zap",
      color: "#f43f5e",
      tags: ["chaotic", "elemental", "dangerous"],
      magic: true,
      suggestions: [
        { domain: "geology", archetypeId: "living_mountain", priority: "recommended", note: "Earth elementals shape the land in real time" },
        { domain: "hydrology", archetypeId: "blood_sea", priority: "optional", note: "Seas infused with elemental fire minerals" },
        { domain: "atmosphere", archetypeId: "singing_winds", priority: "recommended", note: "Air elementals manifest as singing winds" },
        { domain: "climate", archetypeId: "mana_seasons", priority: "essential", note: "Seasons driven by elemental tides" },
        { domain: "biomes", archetypeId: "crystalline_waste", priority: "recommended", note: "Crystal formations of solidified mana" },
        { domain: "ecosystems", archetypeId: "parasitic_network", priority: "optional", note: "Elemental parasites drain energy" },
        { domain: "magic_systems", archetypeId: "elemental_taxonomy", priority: "essential", note: "Magic organized by element \u2014 the only framework that works" },
        { domain: "magic_systems", archetypeId: "wild_surge", priority: "essential", note: "Wild surges are constant here" },
        { domain: "planar_systems", archetypeId: "elemental_bastion", priority: "essential", note: "Elemental planes bleeding through everywhere" },
        { domain: "planar_systems", archetypeId: "bleeding_wound", priority: "recommended", note: "Planar wounds letting elemental chaos in" },
        { domain: "magic_ecology", archetypeId: "ley_line_nexus", priority: "recommended", note: "Ley line nexuses are nexuses of elemental power" }
      ]
    }
  ];
  var BLUEPRINT_MAP = new Map(
    ALL_BLUEPRINTS.map((b) => [b.id, b])
  );
  function getBlueprint(id) {
    return BLUEPRINT_MAP.get(id);
  }
  var BLUEPRINT_TAGS = [...new Set(ALL_BLUEPRINTS.flatMap((b) => b.tags))].sort();

  // src/blueprints/pairs.ts
  var ARCHETYPE_PAIRS = {
    // --- Natural × Natural ---
    "cosmology:habitable_planet": [
      { domain: "atmosphere", archetypeId: "earth_like", reason: "A habitable planet needs a breathable atmosphere" },
      { domain: "hydrology", archetypeId: "major_ocean", reason: "Liquid water is key to habitability" },
      { domain: "climate", archetypeId: "temperate_maritime", reason: "Temperate climate supports diverse life" }
    ],
    "cosmology:binary_stars": [
      { domain: "climate", archetypeId: "mana_seasons", reason: "Binary orbits create complex, unusual seasons" },
      { domain: "cultures", archetypeId: "scholarly_tradition", reason: "Binary star astronomy is a rich field of study" }
    ],
    "cosmology:hollow_world": [
      { domain: "atmosphere", archetypeId: "layered_breathability", reason: "Interior atmosphere behaves differently" },
      { domain: "civilizations", archetypeId: "underground_empire", reason: "Interior civilizations isolated from the outside" }
    ],
    "geology:continental_mountain_range": [
      { domain: "climate", archetypeId: "temperate_maritime", reason: "Mountains create rain shadows shaping climate" },
      { domain: "civilizations", archetypeId: "feudal_kingdom", reason: "Mountains form natural kingdom borders" },
      { domain: "sentient_species", archetypeId: "hardy_mountain_folk", reason: "Mountains breed hardy species" }
    ],
    "geology:floating_islands": [
      { domain: "fauna", archetypeId: "sky_whale", reason: "Sky whales drift between floating islands" },
      { domain: "geography", archetypeId: "sky_port", reason: "Sky ports service the floating world" },
      { domain: "biomes", archetypeId: "floating_reef", reason: "Aerial biomes form on floating debris" }
    ],
    "geology:glass_desert": [
      { domain: "history", archetypeId: "the_sundering", reason: "Something terrible created this wasteland" },
      { domain: "geography", archetypeId: "forbidden_zone", reason: "Glass deserts are often sealed off" }
    ],
    "geology:living_mountain": [
      { domain: "ecosystems", archetypeId: "symbiotic_megaorganism", reason: "The mountain IS a living ecosystem" },
      { domain: "magic_systems", archetypeId: "innate_biological", reason: "The creature's biology is magical" }
    ],
    "hydrology:major_ocean": [
      { domain: "biomes", archetypeId: "coral_reef_biome", reason: "Oceans host reef biomes" },
      { domain: "sentient_species", archetypeId: "aquatic_people", reason: "Oceans support aquatic civilizations" },
      { domain: "fauna", archetypeId: "deep_sea_leviathan", reason: "Deep oceans hide leviathans" }
    ],
    "hydrology:underground_ocean": [
      { domain: "geology", archetypeId: "limestone_cave_network", reason: "Underground oceans form in cave systems" },
      { domain: "biomes", archetypeId: "deep_cavern", reason: "Subterranean biomes surround underground water" }
    ],
    // --- Natural × Life ---
    "biomes:temperate_forest": [
      { domain: "flora", archetypeId: "ancient_hardwood", reason: "Old-growth trees define temperate forests" },
      { domain: "fauna", archetypeId: "apex_predator", reason: "Forests support apex predators" },
      { domain: "ecosystems", archetypeId: "old_growth_forest", reason: "Mature forest ecosystem" }
    ],
    "biomes:coral_reef_biome": [
      { domain: "ecosystems", archetypeId: "coral_reef_ecosystem", reason: "Reef biome and ecosystem are paired" },
      { domain: "fauna", archetypeId: "deep_sea_leviathan", reason: "Deep waters near reefs hold dangers" },
      { domain: "sentient_species", archetypeId: "aquatic_people", reason: "Reef-dwelling civilizations" }
    ],
    "biomes:fungal_jungle": [
      { domain: "flora", archetypeId: "cave_fungus", reason: "Fungal forests are built from giant fungi" },
      { domain: "sentient_species", archetypeId: "fungal_collective", reason: "Fungal intelligence thrives here" }
    ],
    "flora:ancient_hardwood": [
      { domain: "biomes", archetypeId: "temperate_forest", reason: "Ancient trees form forest biomes" },
      { domain: "cultures", archetypeId: "scholarly_tradition", reason: "Sacred groves inspire scholarly traditions" }
    ],
    "flora:singing_tree": [
      { domain: "cultures", archetypeId: "silence_keepers", reason: "Wind-music trees resonate with cultures of silence" },
      { domain: "atmosphere", archetypeId: "singing_winds", reason: "Singing winds play through singing trees" }
    ],
    "flora:corpse_bloom": [
      { domain: "cultures", archetypeId: "death_celebrants", reason: "Funerary flowers pair with death-celebrating cultures" },
      { domain: "ecosystems", archetypeId: "graveyard_ecosystem", reason: "Death-dependent flora feeds necro-ecology" }
    ],
    "fauna:sky_whale": [
      { domain: "geology", archetypeId: "floating_islands", reason: "Sky whales drift between floating islands" },
      { domain: "geography", archetypeId: "sky_port", reason: "Sky ports may dock sky whales" }
    ],
    "fauna:apex_predator": [
      { domain: "ecosystems", archetypeId: "old_growth_forest", reason: "Apex predators anchor mature ecosystems" },
      { domain: "civilizations", archetypeId: "nomadic_confederation", reason: "Nomads coexist with predators" }
    ],
    "fauna:symbiotic_pair": [
      { domain: "ecosystems", archetypeId: "symbiotic_megaorganism", reason: "Symbiotic creatures fit symbiotic ecosystems" },
      { domain: "magic_ecology", archetypeId: "magical_symbiosis", reason: "Magical symbiosis mirrors biological symbiosis" }
    ],
    // --- Sentient × Sentient ---
    "sentient_species:baseline_humanoid": [
      { domain: "civilizations", archetypeId: "feudal_kingdom", reason: "Humans commonly build feudal kingdoms" },
      { domain: "cultures", archetypeId: "warrior_honor", reason: "Human cultures often develop warrior codes" }
    ],
    "sentient_species:long_lived_elven": [
      { domain: "biomes", archetypeId: "temperate_forest", reason: "Elves are associated with ancient forests" },
      { domain: "flora", archetypeId: "ancient_hardwood", reason: "Elven lifespans match ancient trees" },
      { domain: "history", archetypeId: "golden_age", reason: "Long lives create nostalgia for golden ages" }
    ],
    "sentient_species:hardy_mountain_folk": [
      { domain: "geology", archetypeId: "continental_mountain_range", reason: "Mountain folk live in mountains" },
      { domain: "civilizations", archetypeId: "underground_empire", reason: "Dwarven empires go deep" }
    ],
    "sentient_species:aquatic_people": [
      { domain: "hydrology", archetypeId: "major_ocean", reason: "Aquatic peoples need oceans" },
      { domain: "biomes", archetypeId: "coral_reef_biome", reason: "Reef civilizations" }
    ],
    "sentient_species:hive_mind": [
      { domain: "civilizations", archetypeId: "living_city_civ", reason: "A hive mind fits a living-city symbiosis" },
      { domain: "ecosystems", archetypeId: "parasitic_network", reason: "Hive minds navigate parasitic networks" }
    ],
    "sentient_species:constructed_people": [
      { domain: "arcane_sciences", archetypeId: "golem_workforce", reason: "Constructs and golems share origins" },
      { domain: "history", archetypeId: "the_awakening", reason: "The moment constructs gained sentience" }
    ],
    "civilizations:feudal_kingdom": [
      { domain: "sentient_species", archetypeId: "baseline_humanoid", reason: "Feudalism is a human-scale institution" },
      { domain: "cultures", archetypeId: "warrior_honor", reason: "Knightly honor codes" },
      { domain: "geography", archetypeId: "capital_city", reason: "Kingdoms need capitals" }
    ],
    "civilizations:nomadic_confederation": [
      { domain: "climate", archetypeId: "arid_desert", reason: "Nomads follow resources in harsh climates" },
      { domain: "fauna", archetypeId: "migratory_herder", reason: "Nomads follow herds" },
      { domain: "cultures", archetypeId: "nomadic_storytellers", reason: "Oral tradition preserves nomadic culture" }
    ],
    "civilizations:pirate_republic": [
      { domain: "hydrology", archetypeId: "major_ocean", reason: "Pirates need seas to sail" },
      { domain: "geography", archetypeId: "harbor_city", reason: "Pirate havens are hidden ports" }
    ],
    "civilizations:underground_empire": [
      { domain: "geology", archetypeId: "limestone_cave_network", reason: "Underground empires fill cave systems" },
      { domain: "flora", archetypeId: "cave_fungus", reason: "Fungal agriculture feeds underground cities" },
      { domain: "sentient_species", archetypeId: "hardy_mountain_folk", reason: "Mountain folk build underground" }
    ],
    // --- Magic × Everything ---
    "magic_systems:ambient_field": [
      { domain: "magic_ecology", archetypeId: "ley_line_nexus", reason: "Ambient mana pools at ley line nexuses" },
      { domain: "magic_systems", archetypeId: "mana_crystal", reason: "Ambient mana crystallizes over time" },
      { domain: "magic_economy", archetypeId: "mana_currency", reason: "Ambient mana can be harvested as currency" }
    ],
    "magic_systems:divine_gift": [
      { domain: "civilizations", archetypeId: "theocratic_empire", reason: "Divine magic creates theocracies" },
      { domain: "planar_systems", archetypeId: "divine_domain", reason: "Gods reside in divine planes" }
    ],
    "magic_systems:elemental_taxonomy": [
      { domain: "planar_systems", archetypeId: "elemental_bastion", reason: "Elemental magic connects to elemental planes" },
      { domain: "atmosphere", archetypeId: "singing_winds", reason: "Air element magic manifests in winds" }
    ],
    "magic_systems:soul_cost": [
      { domain: "magic_systems", archetypeId: "forbidden_spell", reason: "Soul erosion makes some spells forbidden" },
      { domain: "cultures", archetypeId: "death_celebrants", reason: "Soul-cost magic shapes attitudes toward death" }
    ],
    "magic_systems:mana_crystal": [
      { domain: "magic_economy", archetypeId: "enchanter_guild", reason: "Crystal processing needs guild expertise" },
      { domain: "geology", archetypeId: "limestone_cave_network", reason: "Crystals form in underground deposits" }
    ],
    "magic_systems:runic_system": [
      { domain: "arcane_sciences", archetypeId: "spell_telegraph", reason: "Runes power communication networks" },
      { domain: "cultures", archetypeId: "scholarly_tradition", reason: "Runic study is an academic tradition" }
    ],
    "magic_ecology:ley_line_nexus": [
      { domain: "geography", archetypeId: "crossroads_town", reason: "Cities build on nexus points" },
      { domain: "magic_systems", archetypeId: "wild_surge", reason: "Nexuses produce wild magic surges" }
    ],
    "magic_ecology:mana_desert": [
      { domain: "geography", archetypeId: "forbidden_zone", reason: "Dead zones become forbidden territory" },
      { domain: "history", archetypeId: "the_sundering", reason: "Dead zones are remnants of catastrophe" }
    ],
    "planar_systems:bleeding_wound": [
      { domain: "magic_systems", archetypeId: "wild_surge", reason: "Planar wounds cause wild magic" },
      { domain: "geography", archetypeId: "forbidden_zone", reason: "Planar wounds are sealed off" }
    ],
    "planar_systems:prison_plane": [
      { domain: "history", archetypeId: "forbidden_knowledge_event", reason: "Knowledge of the prisoner is suppressed" },
      { domain: "magic_systems", archetypeId: "forbidden_spell", reason: "The sealing ritual is forbidden knowledge" }
    ],
    "arcane_sciences:golem_workforce": [
      { domain: "sentient_species", archetypeId: "constructed_people", reason: "Some golems become sentient" },
      { domain: "magic_economy", archetypeId: "enchanter_guild", reason: "Guilds produce and maintain golems" }
    ],
    "arcane_sciences:spell_telegraph": [
      { domain: "magic_systems", archetypeId: "runic_system", reason: "Runes encode telegraph signals" },
      { domain: "civilizations", archetypeId: "trading_republic", reason: "Trade republics leverage communication networks" }
    ],
    "history:the_sundering": [
      { domain: "geology", archetypeId: "glass_desert", reason: "The Sundering created wastelands" },
      { domain: "geography", archetypeId: "forbidden_zone", reason: "Sundered zones remain dangerous" },
      { domain: "ecosystems", archetypeId: "war_scarred", reason: "Ecosystems still recovering" }
    ],
    "geography:crossroads_town": [
      { domain: "civilizations", archetypeId: "trading_republic", reason: "Trade routes create merchant power" },
      { domain: "cultures", archetypeId: "maritime_voyagers", reason: "Trade hubs attract seafaring cultures" }
    ],
    "geography:sky_port": [
      { domain: "geology", archetypeId: "floating_islands", reason: "Sky ports serve floating island chains" },
      { domain: "fauna", archetypeId: "sky_whale", reason: "Sky ports may dock living sky creatures" }
    ]
  };
  function getPairs(domain, archetypeId) {
    return ARCHETYPE_PAIRS[`${domain}:${archetypeId}`] || [];
  }

  // client-src/main.ts
  window.store = store;
  window.navigate = navigate;
  window.parseRoute = parseRoute;
  window.ALL_DOMAINS = ALL_DOMAINS;
  window.DOMAIN_CATEGORIES = DOMAIN_CATEGORIES;
  window.getDomainConfig = getDomainConfig;
  window.ALL_BLUEPRINTS = ALL_BLUEPRINTS;
  window.BLUEPRINT_TAGS = BLUEPRINT_TAGS;
  window.getBlueprint = getBlueprint;
  window.getPairs = getPairs;
  window.RELATIONSHIP_TYPES = [
    "contains",
    "located_in",
    "borders",
    "influences",
    "depends_on",
    "evolved_from",
    "created_by",
    "trades_with",
    "conflicts_with",
    "allied_with",
    "worships",
    "uses",
    "consumes",
    "produces",
    "part_of",
    "variant_of",
    "powers",
    "inhibits",
    "custom"
  ];
  window.formatFieldName = (name) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };
  window.truncate = (str, len) => {
    if (!str) return "";
    return str.length > len ? str.substring(0, len) + "..." : str;
  };
  window.relativeTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 6e4);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  window.parseProps = (el) => {
    if (!el || !el.properties) return {};
    try {
      return typeof el.properties === "string" ? JSON.parse(el.properties) : el.properties;
    } catch {
      return {};
    }
  };
  window.downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  window.handleFileUpload = (event) => {
    const input = event.target;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result);
        if (!json.version || !json.type) {
          alert("Invalid file format. Expected a Worldwright export file.");
          return;
        }
        const result = store.importData(json);
        const worldCount = result.worldIds.length;
        const msg = result.constellationId ? `Imported constellation with ${worldCount} world${worldCount !== 1 ? "s" : ""}.` : `Imported ${worldCount} world${worldCount !== 1 ? "s" : ""}.`;
        alert(msg);
        navigate("/worlds");
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      } catch (err) {
        alert("Error importing file: " + err.message);
      }
    };
    reader.readAsText(file);
    input.value = "";
  };
  document.addEventListener("alpine:init", () => {
    const Alpine = window.Alpine;
    Alpine.store("app", {
      route: parseRoute(),
      init() {
        window.addEventListener("hashchange", () => {
          this.route = parseRoute();
          setTimeout(() => window.lucide?.createIcons(), 50);
        });
      },
      get page() {
        return this.route.page;
      },
      get params() {
        return this.route.params;
      },
      get query() {
        return this.route.query;
      }
    });
  });
  console.log(`Worldwright (Client) \u2014 ${ALL_DOMAINS.length} domains, ${ALL_BLUEPRINTS.length} blueprints, ${ALL_DOMAINS.reduce((s, d) => s + (d.archetypes?.length || 0), 0)} archetypes`);
})();
//# sourceMappingURL=app.js.map
