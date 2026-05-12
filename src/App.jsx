import { useState, useEffect, useRef } from "react";

// ── Supabase config ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://wsyraircfrkahootaxsa.supabase.co";
const SUPABASE_KEY = "sb_publishable_6PR9h05uWAM2TOMd8W6mNQ_1yPOiosN";

async function sbFetch(path, options = {}) {
  const res = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
    ...options,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "return=representation",
      ...(options.headers || {})
    }
  });
  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    console.error("Supabase error:", err);
    return null;
  }
  if (res.status === 204 || res.status === 404) return null;
  return res.json();
}

// Load profile (bar) from Supabase
async function loadProfile(userId) {
  const data = await sbFetch(`profiles?id=eq.${userId}&select=bar`);
  return data?.[0]?.bar || {};
}

// Save profile (bar) to Supabase
async function saveProfile(userId, bar) {
  await sbFetch("profiles", {
    method: "POST",
    prefer: "resolution=merge-duplicates",
    body: JSON.stringify({ id: userId, bar, updated_at: new Date().toISOString() })
  });
}

// Load favorites from Supabase
async function loadFavorites(userId) {
  const data = await sbFetch(`favorites?user_id=eq.${userId}&select=cocktail_name&order=created_at.asc`);
  return (data || []).map(r => r.cocktail_name);
}

// Toggle favorite in Supabase
async function addFavorite(userId, name) {
  await sbFetch("favorites", {
    method: "POST",
    prefer: "resolution=ignore-duplicates",
    body: JSON.stringify({ user_id: userId, cocktail_name: name })
  });
}

async function removeFavorite(userId, name) {
  await sbFetch(`favorites?user_id=eq.${userId}&cocktail_name=eq.${encodeURIComponent(name)}`, {
    method: "DELETE",
    prefer: ""
  });
}

// Load custom cocktails from Supabase
async function loadCustomCocktails(userId) {
  const data = await sbFetch(`custom_cocktails?user_id=eq.${userId}&select=data&order=created_at.asc`);
  return (data || []).map(r => r.data);
}

// Save all custom cocktails for a user
async function saveAllCustomCocktails(userId, cocktails) {
  // Delete all existing then re-insert
  await sbFetch(`custom_cocktails?user_id=eq.${userId}`, { method: "DELETE", prefer: "" });
  if (cocktails.length > 0) {
    await sbFetch("custom_cocktails", {
      method: "POST",
      prefer: "resolution=ignore-duplicates",
      body: JSON.stringify(cocktails.map(c => ({ user_id: userId, data: c })))
    });
  }
}

// ── Constants ──────────────────────────────────────────────────────────────
const USERS = ["Jerome", "Evgenia"];
const GOLD = "#c9a96e";
const FAINT = "#1e1a28";
const MUTED = "#6a5a4a";
const ALWAYS_AVAILABLE = ["citron", "citron vert", "orange", "sel", "saline solution"];

// Fixed flavor tag vocabulary
const FLAVOR_TAGS = [
  "sucré","amer","acide","salé","fumé","herbacé","floral","fruité",
  "épicé","crémeux","sec","umami","terreux","tropical","citrus",
  "spirit-forward","léger","complexe","rafraîchissant","riche"
];


const COCKTAIL_TAGS = {
  "100-year-old-cigar": ["amer","fumé","spirit-forward","complexe"],
  "1910": ["fumé","herbacé","acide","complexe"],
  "A Dream to Be": ["spirit-forward","amer","herbacé","complexe"],
  "A Moment of Silence": ["spirit-forward","amer","épicé","complexe"],
  "Absinthe Cocktail": ["herbacé","spirit-forward","sec","complexe"],
  "Absinthe Drip": ["herbacé","complexe","léger","complexe"],
  "Absinthe Drip Cocktail": ["herbacé","spirit-forward","léger","complexe"],
  "Absinthe Frappé": ["herbacé","rafraîchissant","léger","complexe"],
  "Absinthe Martini": ["herbacé","sec","spirit-forward","complexe"],
  "Absinthe Mojito": ["herbacé","rafraîchissant","acide","complexe"],
  "Absinthe Sour": ["herbacé","acide","rafraîchissant","complexe"],
  "Absinthe Spider Highball": ["herbacé","rafraîchissant","léger","complexe"],
  "Absinthe by Jimmy": ["herbacé","spirit-forward","complexe","complexe"],
  "Absolute Gangster": ["fruité","sucré","acide","rafraîchissant"],
  "Acapulco": ["fruité","tropical","rafraîchissant","léger"],
  "Adelaide": ["amer","fruité","rafraîchissant","léger"],
  "Adios Motherfucker": ["fruité","sucré","acide","rafraîchissant"],
  "Adonis": ["sec","herbacé","complexe","léger"],
  "Adriatique Cocktail": ["amer","herbacé","fruité","léger"],
  "Affinity": ["spirit-forward","amer","herbacé","complexe"],
  "Affogato Cocktail": ["amer","sucré","crémeux","riche"],
  "Aged Grappa Espresso Martini": ["amer","spirit-forward","crémeux","riche"],
  "Aged Honey Daiquiri": ["sucré","acide","fruité","rafraîchissant"],
  "Aku Aku": ["tropical","fruité","sucré","rafraîchissant"],
  "Alabama Slammer": ["fruité","sucré","léger","rafraîchissant"],
  "Alaska": ["herbacé","spirit-forward","complexe","sec"],
  "Alaska (Straub's 1914 recipe)": ["herbacé","spirit-forward","complexe","sec"],
  "Alexander": ["crémeux","sucré","riche","fruité"],
  "Alexander The Great": ["crémeux","sucré","amer","riche"],
  "Almond Atholl Brose": ["crémeux","sucré","riche","spirit-forward"],
  "Amaretto Manhattan": ["sucré","amer","riche","complexe"],
  "Amaretto Sour": ["acide","sucré","fruité","rafraîchissant"],
  "Amaretto Tequila Old Fashioned": ["sucré","spirit-forward","épicé","riche"],
  "Ambrosia Cocktail": ["fruité","crémeux","sucré","riche"],
  "American Beauty (by David Embury)": ["herbacé","fruité","acide","complexe"],
  "Americano": ["amer","herbacé","rafraîchissant","léger"],
  "Ampersand Cocktail": ["spirit-forward","amer","herbacé","complexe"],
  "Angel Face": ["fruité","floral","complexe","spirit-forward"],
  "Angel's Advocate": ["floral","herbacé","fruité","léger"],
  "Angel's Draft": ["fruité","tropical","herbacé","rafraîchissant"],
  "Aperitivo Spritz": ["amer","fruité","rafraîchissant","léger"],
  "Aperol Spritz": ["amer","fruité","rafraîchissant","léger"],
  "Apple Blossom Cocktail": ["fruité","floral","acide","léger"],
  "Apple Jack Rabbit (Savoy)": ["fruité","sucré","acide","rafraîchissant"],
  "Apple Martini": ["fruité","sucré","acide","léger"],
  "Aventura": ["fumé","fruité","épicé","complexe"],
  "Avenue San Martin": ["acide","fruité","floral","rafraîchissant"],
  "Aviation": ["floral","acide","fruité","complexe"],
  "Aviation Cocktail (Difford's recipe)": ["floral","acide","fruité","complexe"],
  "Azalea Margarita": ["fruité","acide","floral","rafraîchissant"],
  "Añejo Manhattan": ["spirit-forward","amer","épicé","complexe"],
  "Añogo": ["fruité","épicé","sucré","crémeux"],
  "B-52 Shot": ["crémeux","sucré","riche","spirit-forward"],
  "Bahama Mama": ["tropical","fruité","sucré","rafraîchissant"],
  "Bakewell Tart Sour": ["sucré","acide","fruité","crémeux"],
  "Bamboo": ["sec","herbacé","umami","léger"],
  "Banana Calling": ["fruité","floral","herbacé","léger"],
  "Banana Daiquiri": ["fruité","sucré","tropical","rafraîchissant"],
  "Banana Split": ["crémeux","sucré","fruité","riche"],
  "Barbacoa": ["fumé","épicé","acide","complexe"],
  "Barbary Coast": ["fumé","crémeux","sucré","riche"],
  "Batida Rosa": ["fruité","tropical","sucré","crémeux"],
  "Beach Blonde": ["fruité","tropical","sucré","crémeux"],
  "Bee's Knees": ["acide","floral","sucré","rafraîchissant"],
  "Bellini": ["fruité","floral","sucré","léger"],
  "Bellini Peach Spritz": ["fruité","floral","sucré","rafraîchissant"],
  "Bellini-Tini": ["fruité","floral","sucré","léger"],
  "Bensonhurst": ["spirit-forward","amer","herbacé","complexe"],
  "Bergamot & Coconut Cobbler": ["floral","tropical","sucré","fruité"],
  "Bergamot Bamboo": ["floral","herbacé","sec","léger"],
  "Bernice": ["fruité","léger","acide","rafraîchissant"],
  "Bessie & Jessie": ["épicé","sucré","crémeux","riche"],
  "Bicicletta Spritz": ["amer","fruité","rafraîchissant","léger"],
  "Biggles Aviation": ["floral","acide","fruité","herbacé"],
  "Biggles Sidecar": ["acide","fruité","épicé","rafraîchissant"],
  "Bijou": ["herbacé","amer","complexe","spirit-forward"],
  "Bikini Martini": ["fruité","sucré","herbacé","léger"],
  "Bird of Paradise": ["fruité","floral","acide","léger"],
  "Bitter in Brazil": ["amer","acide","rafraîchissant","fruité"],
  "Black Jack": ["herbacé","amer","spirit-forward","complexe"],
  "Black Negroni": ["amer","fumé","herbacé","complexe"],
  "Black Russian": ["amer","sucré","riche","spirit-forward"],
  "Black Widow's Bite": ["fruité","sucré","acide","léger"],
  "Blackthorn": ["fruité","floral","complexe","spirit-forward"],
  "Blackthorn (English)": ["fruité","herbacé","acide","complexe"],
  "Blackthorn No. 5": ["fruité","herbacé","acide","complexe"],
  "Blinker (Hawksmoor's Riff)": ["fruité","acide","épicé","rafraîchissant"],
  "Blood and Sand": ["fruité","amer","complexe","sucré"],
  "Bloody Mary": ["épicé","salé","umami","acide"],
  "Blue Blazer": ["spirit-forward","sucré","riche","épicé"],
  "Bobby Burns": ["herbacé","spirit-forward","complexe","riche"],
  "Bohemian Mule": ["épicé","herbacé","rafraîchissant","acide"],
  "Bon Bon": ["fruité","sucré","acide","léger"],
  "Boston Sour": ["acide","sucré","fruité","rafraîchissant"],
  "Boulevardier": ["amer","spirit-forward","riche","complexe"],
  "Bradford Martini": ["sec","spirit-forward","herbacé","léger"],
  "Bramble": ["fruité","acide","sucré","rafraîchissant"],
  "Brandy Alexander": ["crémeux","sucré","riche","fruité"],
  "Brandy Crusta": ["acide","sucré","fruité","complexe"],
  "Brandy Flip": ["riche","sucré","crémeux","spirit-forward"],
  "Brandy Manhattan": ["spirit-forward","amer","herbacé","complexe"],
  "Brandy Old Fashioned (Wisconsin-style)": ["spirit-forward","sucré","fruité","épicé"],
  "Brasil": ["fruité","herbacé","acide","rafraîchissant"],
  "Brass Rail": ["herbacé","spirit-forward","épicé","riche"],
  "Brazil 66": ["acide","fruité","rafraîchissant","léger"],
  "Brazil Basil Smash": ["herbacé","acide","rafraîchissant","fruité"],
  "Brazilian Contessa": ["fruité","floral","acide","léger"],
  "Brazuca Remedy": ["fruité","épicé","acide","rafraîchissant"],
  "Breakfast Martini": ["fruité","acide","herbacé","complexe"],
  "Bronx": ["fruité","herbacé","rafraîchissant","léger"],
  "Brooklyn": ["amer","spirit-forward","complexe","sec"],
  "Brown Derby": ["fruité","acide","sucré","rafraîchissant"],
  "Bubo Bubo": ["amer","spirit-forward","épicé","complexe"],
  "Buck's Fizz": ["fruité","rafraîchissant","léger","acide"],
  "Bucket": ["fruité","acide","sucré","rafraîchissant"],
  "Bucket List": ["fruité","sucré","acide","rafraîchissant"],
  "Bullshot": ["salé","umami","épicé","spirit-forward"],
  "Burning Bright": ["fruité","amer","épicé","complexe"],
  "Burnt Fuselage": ["fumé","spirit-forward","riche","complexe"],
  "Buttercup": ["fruité","floral","acide","léger"],
  "Byculla": ["épicé","umami","herbacé","complexe"],
  "Cablegram": ["épicé","spirit-forward","acide","rafraîchissant"],
  "Cachaça Fruit Cup": ["fruité","rafraîchissant","herbacé","léger"],
  "Cadáver Reviver": ["épicé","acide","fruité","complexe"],
  "Caipirinha": ["acide","sucré","rafraîchissant","fruité"],
  "Caipiroska": ["acide","sucré","fruité","rafraîchissant"],
  "Californian Margarita": ["acide","fruité","sucré","rafraîchissant"],
  "Cameron's Kick": ["épicé","herbacé","complexe","spirit-forward"],
  "Canary Flip": ["crémeux","sucré","riche","fruité"],
  "Canchànchara": ["sucré","acide","fruité","rafraîchissant"],
  "Caneflower": ["floral","acide","fruité","rafraîchissant"],
  "Cannonball": ["fumé","fruité","épicé","complexe"],
  "Caribbean Sazerac": ["amer","herbacé","épicé","spirit-forward"],
  "Carlton Banks": ["fruité","spirit-forward","complexe","riche"],
  "Casa Savoia Boulevardier": ["amer","spirit-forward","riche","complexe"],
  "Casa Savoia Garibaldi": ["amer","fruité","rafraîchissant","léger"],
  "Casa Savoia Spritz": ["amer","fruité","rafraîchissant","léger"],
  "Casablanca No.2": ["crémeux","sucré","fruité","léger"],
  "Ce Soir (This Evening)": ["fruité","floral","acide","léger"],
  "Celebration": ["fruité","floral","sucré","léger"],
  "Celery Century": ["herbacé","terreux","acide","rafraîchissant"],
  "Celery Gimlet No.2": ["herbacé","acide","terreux","rafraîchissant"],
  "Champagne Cocktail": ["sec","acide","rafraîchissant","complexe"],
  "Champagne Piña Colada": ["tropical","crémeux","fruité","sucré"],
  "Champagne Snowball": ["fruité","sucré","floral","léger"],
  "Chanbanger Cocktail": ["fruité","tropical","sucré","rafraîchissant"],
  "Charlie Chaplin": ["fruité","sucré","acide","rafraîchissant"],
  "Chartreuse Swizzle": ["herbacé","tropical","rafraîchissant","complexe"],
  "Cherry Springer": ["fruité","floral","acide","herbacé"],
  "China Blue Cocktail": ["fruité","floral","sucré","léger"],
  "Chinese Whisper": ["épicé","fruité","acide","rafraîchissant"],
  "Chocolate Orange Espresso Martini": ["amer","sucré","fruité","crémeux"],
  "Christmas Negroni": ["amer","épicé","herbacé","complexe"],
  "Christmas Pudding & Custard Cocktail": ["sucré","épicé","riche","crémeux"],
  "Christmas Velvet Alexander": ["crémeux","sucré","riche","herbacé"],
  "Chrysanthemum": ["herbacé","floral","sec","léger"],
  "Circus Circus": ["amer","spirit-forward","herbacé","complexe"],
  "Clan MacLeod": ["fumé","épicé","spirit-forward","complexe"],
  "Clandestine": ["floral","spirit-forward","complexe","herbacé"],
  "Claridge Cocktail": ["herbacé","fruité","acide","léger"],
  "Closing Argument": ["fumé","herbacé","acide","complexe"],
  "Clover Club": ["fruité","floral","acide","sucré"],
  "Club Cocktail (Difford's recipe)": ["acide","fruité","floral","léger"],
  "Cobbler": ["fruité","rafraîchissant","sucré","léger"],
  "Coco Geisha": ["floral","crémeux","sucré","léger"],
  "Coconut Rum Punch": ["tropical","crémeux","sucré","fruité"],
  "Coffee & Tonic": ["amer","rafraîchissant","léger","terreux"],
  "Colleen Bawn": ["herbacé","fruité","acide","complexe"],
  "Collins": ["acide","rafraîchissant","léger","sucré"],
  "Colonel Ward": ["fruité","tropical","sucré","rafraîchissant"],
  "Colorado Bulldog": ["crémeux","sucré","riche","spirit-forward"],
  "Comte de Sureau": ["floral","fruité","acide","léger"],
  "Concrete Slippers": ["épicé","sucré","spirit-forward","complexe"],
  "Copenhagen Cocktail": ["fruité","herbacé","acide","léger"],
  "Corpse Reviver No. Blue": ["acide","herbacé","fruité","complexe"],
  "Corpse Reviver No.2": ["herbacé","acide","fruité","complexe"],
  "Corpse Reviver No.2 (Contemporary Recipe)": ["herbacé","acide","fruité","complexe"],
  "Corpse Reviver No.4": ["acide","herbacé","fruité","complexe"],
  "Cosmonaut": ["acide","fruité","sucré","rafraîchissant"],
  "Cosmopolitan": ["acide","fruité","sucré","rafraîchissant"],
  "Courtside": ["fruité","acide","rafraîchissant","léger"],
  "Cowboy Derby": ["sucré","épicé","spirit-forward","riche"],
  "Creme Egg Cocktail": ["sucré","crémeux","riche","fruité"],
  "Creole Cosmo": ["fruité","acide","sucré","rafraîchissant"],
  "Crystal Clear": ["floral","léger","sec","rafraîchissant"],
  "Crystal Ship": ["fumé","fruité","acide","complexe"],
  "Crème Anglaise Cocktail": ["crémeux","sucré","riche","complexe"],
  "Cuba Libre": ["sucré","rafraîchissant","léger","épicé"],
  "Cucumber Gimlet": ["herbacé","acide","rafraîchissant","léger"],
  "Cucumber Sake-Tini": ["herbacé","léger","rafraîchissant","sec"],
  "Curtain Call": ["fruité","acide","sucré","rafraîchissant"],
  "Daiquiri": ["acide","sucré","rafraîchissant","fruité"],
  "Daiquiri No.1": ["acide","sucré","rafraîchissant","fruité"],
  "Daiquiri on-the-rocks": ["acide","sucré","rafraîchissant","fruité"],
  "Dairy Milk Chocolate": ["crémeux","sucré","riche","complexe"],
  "Daisy Cutter Martini": ["herbacé","acide","fruité","léger"],
  "Dama Blanca": ["acide","herbacé","fruité","rafraîchissant"],
  "Dantes in Fernet": ["amer","herbacé","épicé","complexe"],
  "Dark 'n' Stormy": ["épicé","sucré","rafraîchissant","fruité"],
  "Dark and Stormy": ["épicé","sucré","rafraîchissant","fruité"],
  "Darlington": ["herbacé","fruité","floral","léger"],
  "Dawa": ["acide","sucré","fruité","rafraîchissant"],
  "De La Louisiane": ["amer","herbacé","spirit-forward","complexe"],
  "De La Louisiane No.4": ["amer","herbacé","spirit-forward","complexe"],
  "Death Flip": ["herbacé","épicé","fumé","complexe"],
  "Death Star": ["amer","fruité","herbacé","complexe"],
  "Death in Venice": ["amer","fruité","rafraîchissant","léger"],
  "Death in the Afternoon": ["herbacé","sec","complexe","complexe"],
  "Detroit Athletic Club": ["herbacé","spirit-forward","épicé","complexe"],
  "Diamondback": ["herbacé","épicé","spirit-forward","complexe"],
  "Difford's Fruit Cup No.1": ["fruité","herbacé","rafraîchissant","léger"],
  "Dirty Banana": ["crémeux","fruité","sucré","riche"],
  "Dirty Martini": ["salé","sec","spirit-forward","umami"],
  "Don Pone": ["épicé","fruité","sucré","complexe"],
  "Double Grape": ["fruité","acide","léger","rafraîchissant"],
  "Dragon Punch": ["fumé","épicé","fruité","complexe"],
  "Dried Meadow Flower": ["floral","herbacé","acide","léger"],
  "Dry Martini": ["sec","spirit-forward","herbacé","léger"],
  "Dublin Spider Highball": ["spirit-forward","amer","léger","rafraîchissant"],
  "Duchess": ["herbacé","léger","sec","complexe"],
  "Dulchin": ["acide","fruité","sucré","floral"],
  "Dutch Breakfast Cocktail": ["floral","herbacé","sucré","léger"],
  "Dutch Courage": ["herbacé","spirit-forward","épicé","complexe"],
  "Earl Grey MarTEAni": ["floral","herbacé","acide","léger"],
  "East India No.1": ["fruité","complexe","épicé","spirit-forward"],
  "East India No.2": ["fruité","tropical","épicé","complexe"],
  "Easy Speak": ["amer","herbacé","spirit-forward","complexe"],
  "Eclipse": ["fruité","sucré","acide","rafraîchissant"],
  "Eclipse Cocktail": ["fruité","épicé","sucré","complexe"],
  "Edison's Medicine": ["fruité","acide","épicé","rafraîchissant"],
  "El Presidente": ["fruité","sucré","complexe","rafraîchissant"],
  "Elderflower Collins": ["floral","acide","rafraîchissant","léger"],
  "Electric Lemonade": ["fruité","acide","sucré","rafraîchissant"],
  "English Marmalade": ["fruité","amer","acide","complexe"],
  "Enrico Palazzo": ["fruité","acide","sucré","rafraîchissant"],
  "Enzoni": ["fruité","amer","acide","rafraîchissant"],
  "Ernest + Rita": ["floral","acide","fruité","léger"],
  "Ernst Happel": ["herbacé","fruité","acide","léger"],
  "Esmeralda": ["tropical","floral","fruité","rafraîchissant"],
  "Espresso Martini": ["amer","sucré","riche","crémeux"],
  "Fairbanks No.1": ["herbacé","fruité","acide","léger"],
  "Fairy Cream": ["herbacé","crémeux","sucré","complexe"],
  "Fall Into Spring Negroni": ["amer","floral","herbacé","complexe"],
  "Fancy Free": ["spirit-forward","amer","épicé","riche"],
  "Fantasticus": ["fruité","tropical","floral","rafraîchissant"],
  "Fat Cat": ["fruité","herbacé","acide","léger"],
  "Favola": ["floral","herbacé","acide","léger"],
  "Feather Duster Crusta": ["fruité","acide","herbacé","complexe"],
  "Fifty-Fifty Martini": ["sec","spirit-forward","herbacé","complexe"],
  "Fire & Brimstone": ["fumé","épicé","acide","complexe"],
  "Fitzgerald": ["acide","sucré","amer","rafraîchissant"],
  "Five Keys": ["amer","spirit-forward","épicé","complexe"],
  "Fleur de Paradis": ["floral","fruité","léger","sucré"],
  "Floradora": ["fruité","floral","acide","rafraîchissant"],
  "Floral Daiquiri": ["floral","acide","fruité","rafraîchissant"],
  "Florence Cocktail": ["fruité","acide","sucré","léger"],
  "Fluffy Duck": ["fruité","crémeux","sucré","léger"],
  "Fog Cutter": ["tropical","fruité","complexe","sucré"],
  "Fog Cutter (Bramble-style)": ["fruité","tropical","acide","complexe"],
  "For Sake's Sake": ["fruité","umami","acide","léger"],
  "Forbidden Fruit": ["fruité","herbacé","sucré","complexe"],
  "Ford Cocktail": ["herbacé","spirit-forward","complexe","sec"],
  "Ford cocktail": ["herbacé","spirit-forward","complexe","sec"],
  "Four Aces": ["épicé","fruité","sucré","rafraîchissant"],
  "Franklin's 15:1 Martini": ["sec","spirit-forward","herbacé","léger"],
  "French 125": ["acide","floral","rafraîchissant","léger"],
  "French 75": ["acide","sec","rafraîchissant","léger"],
  "French Daiquiri": ["acide","fruité","sucré","floral"],
  "French Martini": ["fruité","sucré","léger","rafraîchissant"],
  "Fresh White Lady": ["herbacé","acide","fruité","rafraîchissant"],
  "Frisco Sour": ["acide","herbacé","sucré","rafraîchissant"],
  "Frozen Daiquiri": ["acide","sucré","rafraîchissant","fruité"],
  "Fruit Cup Spritz": ["fruité","rafraîchissant","léger","herbacé"],
  "Fruit Salad": ["fruité","sucré","léger","rafraîchissant"],
  "Fruity Sex on the Beach": ["fruité","sucré","tropical","rafraîchissant"],
  "Fumigator Flip": ["fumé","riche","sucré","complexe"],
  "Game Set Match": ["amer","herbacé","acide","complexe"],
  "Garden Sour": ["herbacé","fumé","acide","rafraîchissant"],
  "Garibaldicus": ["floral","amer","fruité","rafraîchissant"],
  "Garibaldino": ["amer","fruité","rafraîchissant","léger"],
  "Geisha Martini": ["floral","léger","sec","herbacé"],
  "Gennaro's Sidecar": ["acide","fruité","sucré","rafraîchissant"],
  "Georgia Mint Julep": ["fruité","herbacé","sucré","rafraîchissant"],
  "German Vacation": ["tropical","fruité","épicé","rafraîchissant"],
  "Gimlet": ["acide","sucré","rafraîchissant","léger"],
  "Gin & Tonic": ["amer","herbacé","rafraîchissant","léger"],
  "Gin Alexander": ["crémeux","sucré","herbacé","riche"],
  "Gin Basil Smash": ["herbacé","acide","rafraîchissant","léger"],
  "Gin Fizz": ["acide","rafraîchissant","léger","sucré"],
  "Gin Fruit Cup": ["herbacé","fruité","rafraîchissant","léger"],
  "Gin Rickey": ["acide","herbacé","rafraîchissant","léger"],
  "Gin Sour": ["acide","sucré","rafraîchissant","fruité"],
  "Ginger Cosmo": ["épicé","fruité","acide","rafraîchissant"],
  "Ginger Martini": ["épicé","spirit-forward","sec","rafraîchissant"],
  "Gingerbread": ["épicé","sucré","riche","complexe"],
  "Gingerbread Old Fashioned": ["épicé","sucré","riche","spirit-forward"],
  "Godfather": ["sucré","spirit-forward","riche","complexe"],
  "Godmother": ["sucré","spirit-forward","riche","léger"],
  "Gold Rush": ["acide","sucré","floral","rafraîchissant"],
  "Golden Spritz": ["floral","fruité","rafraîchissant","léger"],
  "Grand Cosmopolitan": ["fruité","acide","sucré","rafraîchissant"],
  "Grand White Lady": ["fruité","acide","herbacé","léger"],
  "Grasshopper": ["crémeux","sucré","herbacé","riche"],
  "Grasshopper No. 2": ["herbacé","crémeux","sucré","fumé"],
  "Green Deacon": ["herbacé","fruité","acide","léger"],
  "Green Eyes": ["fruité","tropical","sucré","rafraîchissant"],
  "Green Swizzle": ["herbacé","tropical","rafraîchissant","acide"],
  "Greenpoint": ["spirit-forward","amer","herbacé","complexe"],
  "Greyhounds Tooth": ["fruité","acide","amer","rafraîchissant"],
  "Gustings' Grasshopper": ["herbacé","crémeux","sucré","riche"],
  "Haberdasher": ["fruité","acide","sucré","rafraîchissant"],
  "Harvest Cocktail": ["fruité","épicé","sucré","complexe"],
  "Harvey Wallbanger": ["fruité","sucré","herbacé","léger"],
  "Haystack Cocktail": ["sucré","crémeux","riche","fruité"],
  "Hearn Cocktail": ["herbacé","spirit-forward","complexe","sec"],
  "Hemingway Daiquiri": ["acide","sec","fruité","rafraîchissant"],
  "Hemingway Special (Papa Doble)": ["acide","fruité","sec","rafraîchissant"],
  "Hi Falutin": ["spirit-forward","amer","herbacé","complexe"],
  "High King": ["fruité","spirit-forward","herbacé","complexe"],
  "Highland Sling": ["fruité","herbacé","acide","rafraîchissant"],
  "Holy Joe Cocktail": ["épicé","spirit-forward","complexe","herbacé"],
  "Honey Badger": ["épicé","sucré","acide","rafraîchissant"],
  "Honey Cobbler": ["sucré","fruité","spirit-forward","rafraîchissant"],
  "Honey Cosmopolitan": ["fruité","sucré","acide","floral"],
  "Honey Sour": ["sucré","acide","spirit-forward","rafraîchissant"],
  "Honeysuckle Daiquiri": ["sucré","floral","fruité","rafraîchissant"],
  "Horse's Neck": ["épicé","sucré","rafraîchissant","léger"],
  "Hot Toddy": ["épicé","sucré","riche","floral"],
  "Hotel Nacional": ["fruité","tropical","sucré","rafraîchissant"],
  "Hotel Nacional Special": ["fruité","tropical","sucré","rafraîchissant"],
  "Hugo": ["floral","rafraîchissant","léger","sucré"],
  "Humble Pie": ["fruité","épicé","sucré","acide"],
  "Hummingbird": ["tropical","fruité","sucré","crémeux"],
  "Hunter Cocktail": ["fruité","spirit-forward","épicé","complexe"],
  "Hunter's Verdict": ["fruité","amer","épicé","complexe"],
  "Hunter-cocktail": ["fruité","spirit-forward","épicé","complexe"],
  "Hurricane": ["fruité","tropical","sucré","rafraîchissant"],
  "IPAlicus": ["amer","floral","herbacé","rafraîchissant"],
  "Ice in the Hat": ["herbacé","fruité","rafraîchissant","léger"],
  "In the August Sun": ["tropical","fruité","sucré","rafraîchissant"],
  "In-Seine": ["floral","fruité","acide","léger"],
  "Irish Cocktail": ["spirit-forward","herbacé","amer","complexe"],
  "Irish Coffee": ["amer","crémeux","sucré","riche"],
  "Irish Maid": ["floral","fruité","acide","rafraîchissant"],
  "Irish Old Fashioned": ["spirit-forward","amer","épicé","riche"],
  "Italian Margarita": ["acide","fruité","sucré","herbacé"],
  "Italian Sun": ["fruité","acide","sucré","rafraîchissant"],
  "Italicup": ["floral","fruité","rafraîchissant","léger"],
  "Iz Bananaz": ["fruité","tropical","sucré","crémeux"],
  "Jack Collins": ["acide","fruité","rafraîchissant","léger"],
  "Jack Rose": ["acide","fruité","sucré","rafraîchissant"],
  "Jaffa Cake (Jaffa Martini)": ["fruité","sucré","crémeux","léger"],
  "Jamie's Mojito": ["herbacé","acide","sucré","rafraîchissant"],
  "Japanese Pear": ["fruité","léger","floral","sucré"],
  "Japanese Slipper": ["fruité","sucré","acide","léger"],
  "Jasmine": ["acide","amer","fruité","rafraîchissant"],
  "Jeez Louise": ["amer","herbacé","acide","complexe"],
  "Jelly Belly Beany": ["fruité","tropical","sucré","rafraîchissant"],
  "John Collins": ["acide","rafraîchissant","léger","sucré"],
  "Jungle Bird": ["amer","fruité","tropical","complexe"],
  "Jägerita": ["herbacé","épicé","acide","complexe"],
  "Kamaniwanalaya": ["tropical","fruité","complexe","sucré"],
  "Kentucky Buck": ["fruité","épicé","acide","rafraîchissant"],
  "King's Jubilee": ["fruité","tropical","sucré","rafraîchissant"],
  "Kingston Club": ["fruité","épicé","sucré","complexe"],
  "Kingston Negroni": ["amer","fruité","spirit-forward","complexe"],
  "Kir Royale": ["fruité","floral","sucré","léger"],
  "L'Americano": ["amer","herbacé","rafraîchissant","léger"],
  "L'Americano Moderno": ["amer","herbacé","rafraîchissant","léger"],
  "L'Arte Della Bellezza": ["floral","herbacé","acide","léger"],
  "La Cola Nostra": ["fruité","tropical","sucré","rafraîchissant"],
  "La Dolce Vita": ["fruité","sucré","crémeux","léger"],
  "La Poire des Benedictines": ["herbacé","fruité","sucré","complexe"],
  "Landing Gear": ["fruité","épicé","sucré","complexe"],
  "Larchmont": ["fruité","acide","sucré","rafraîchissant"],
  "Last Palabra": ["fumé","herbacé","acide","complexe"],
  "Last Word": ["herbacé","acide","fruité","complexe"],
  "Lavarello": ["fruité","acide","rafraîchissant","léger"],
  "Le Commercant (The Merchant)": ["fruité","acide","sucré","complexe"],
  "Left Bank Martini": ["sec","spirit-forward","herbacé","complexe"],
  "Left Hand": ["amer","spirit-forward","herbacé","complexe"],
  "Lemon Beat": ["acide","fruité","rafraîchissant","léger"],
  "Lemon Drop": ["acide","sucré","fruité","rafraîchissant"],
  "Lemon Meringue Pie'tini": ["sucré","acide","crémeux","fruité"],
  "Lemon Sherbet Margarita": ["acide","sucré","fruité","rafraîchissant"],
  "Lemony": ["acide","herbacé","fruité","rafraîchissant"],
  "Less is More Negroni": ["amer","herbacé","spirit-forward","complexe"],
  "Limoncello Spritz": ["acide","fruité","rafraîchissant","léger"],
  "Lion's Tail": ["épicé","sucré","spirit-forward","complexe"],
  "Little Italy": ["amer","spirit-forward","herbacé","complexe"],
  "London Gypsy": ["herbacé","floral","acide","léger"],
  "Lone Oak": ["herbacé","acide","fruité","rafraîchissant"],
  "Long Island Iced Tea": ["spirit-forward","acide","sucré","rafraîchissant"],
  "Lost Plane": ["fruité","amer","herbacé","complexe"],
  "Lotus Espresso": ["amer","sucré","crémeux","épicé"],
  "Love Heart": ["fruité","sucré","floral","léger"],
  "Luigi": ["fruité","floral","acide","léger"],
  "M & M": ["fumé","amer","herbacé","complexe"],
  "Macunaíma": ["fruité","tropical","acide","rafraîchissant"],
  "Made Man": ["spirit-forward","amer","fruité","complexe"],
  "Mai Tai": ["tropical","fruité","sucré","complexe"],
  "Mai Tai (Difford's recipe)": ["tropical","fruité","sucré","complexe"],
  "Man O' War": ["fruité","sucré","spirit-forward","complexe"],
  "Manhattan": ["spirit-forward","amer","riche","complexe"],
  "Manhattan Island": ["spirit-forward","amer","herbacé","complexe"],
  "Maple Old Fashioned": ["sucré","spirit-forward","épicé","riche"],
  "Maple Rum Old Fashioned": ["sucré","spirit-forward","épicé","riche"],
  "Margarita": ["acide","sucré","salé","rafraîchissant"],
  "Margarita on-the-rocks (Difford's)": ["acide","sucré","salé","rafraîchissant"],
  "Maria Theresa Margarita": ["fruité","acide","sucré","rafraîchissant"],
  "Marsala Martini": ["fruité","riche","sucré","sec"],
  "Marshmallow (Marshmallow 'Martini')": ["sucré","crémeux","léger","complexe"],
  "Martinez": ["herbacé","spirit-forward","complexe","amer"],
  "Mary Pickford": ["fruité","tropical","sucré","rafraîchissant"],
  "Medicina Latina": ["épicé","fruité","acide","rafraîchissant"],
  "Mexico City": ["fruité","acide","épicé","rafraîchissant"],
  "Mezcal Fruit Cup": ["fumé","fruité","herbacé","rafraîchissant"],
  "Mezcal Margarita": ["fumé","acide","sucré","rafraîchissant"],
  "Mezcal Negroni": ["fumé","amer","herbacé","complexe"],
  "Mezcal Stone Sour": ["fumé","acide","fruité","épicé"],
  "Mezcalero": ["fumé","épicé","herbacé","complexe"],
  "Michelada": ["épicé","salé","acide","rafraîchissant"],
  "Midnight Over Tennessee": ["amer","sucré","spirit-forward","riche"],
  "Midnight Stinger": ["herbacé","épicé","spirit-forward","complexe"],
  "Milanese Breakfast Martini": ["fruité","herbacé","acide","léger"],
  "Milano Torino": ["amer","herbacé","rafraîchissant","léger"],
  "Mimosa": ["fruité","léger","rafraîchissant","acide"],
  "Mint Cocktail": ["herbacé","acide","rafraîchissant","léger"],
  "Mint Julep": ["herbacé","sucré","rafraîchissant","léger"],
  "Minty Pentones": ["herbacé","acide","fruité","rafraîchissant"],
  "Mission Bell": ["fumé","amer","épicé","complexe"],
  "Missionary's Downfall": ["fruité","herbacé","tropical","rafraîchissant"],
  "Mizuwari": ["spirit-forward","léger","rafraîchissant","sec"],
  "Mojito": ["herbacé","acide","sucré","rafraîchissant"],
  "Monte Carlo": ["herbacé","spirit-forward","épicé","complexe"],
  "Monte Cassino": ["herbacé","acide","fruité","complexe"],
  "Monte Paloma": ["fruité","acide","amer","rafraîchissant"],
  "MonteNegroni": ["amer","herbacé","spirit-forward","complexe"],
  "Monterita": ["acide","amer","fruité","rafraîchissant"],
  "Moo'lata": ["crémeux","sucré","amer","riche"],
  "Moscow Mule": ["épicé","acide","rafraîchissant","léger"],
  "Mosquito": ["acide","fruité","sucré","rafraîchissant"],
  "Motox": ["fruité","acide","sucré","rafraîchissant"],
  "Mountain Man Cocktail": ["sucré","épicé","spirit-forward","riche"],
  "Mr Bali Hai": ["tropical","amer","sucré","complexe"],
  "Mrs Daisy Robinson": ["acide","fruité","floral","léger"],
  "Mule's Hind Leg": ["herbacé","sucré","fruité","complexe"],
  "Murano Negroni": ["amer","herbacé","spirit-forward","complexe"],
  "Naked and Famous": ["fumé","acide","herbacé","complexe"],
  "Naughty Charles": ["fumé","crémeux","sucré","riche"],
  "Navigator": ["fruité","acide","herbacé","rafraîchissant"],
  "Negroni": ["amer","herbacé","spirit-forward","complexe"],
  "Negroni Bianco Bergamotto": ["amer","floral","herbacé","complexe"],
  "Negroni Sbagliato": ["amer","fruité","rafraîchissant","léger"],
  "Negroni Tredici": ["amer","herbacé","spirit-forward","complexe"],
  "New York Minute": ["fruité","herbacé","acide","rafraîchissant"],
  "New York Sour": ["acide","fruité","sucré","riche"],
  "New York Stone Sour": ["acide","fruité","sucré","rafraîchissant"],
  "Nuclear Banana Daiquiri": ["fruité","tropical","acide","sucré"],
  "Nuclear Daiquiri": ["herbacé","acide","tropical","rafraîchissant"],
  "Oaxacan Old Fashioned": ["fumé","spirit-forward","épicé","complexe"],
  "Old Cuban": ["herbacé","acide","sucré","complexe"],
  "Old Fashioned": ["spirit-forward","amer","épicé","riche"],
  "Old Pal": ["amer","spirit-forward","sec","complexe"],
  "Old Vermont": ["sucré","acide","herbacé","rafraîchissant"],
  "One Sip Martini": ["sec","spirit-forward","herbacé","léger"],
  "Orange Brulée": ["fruité","sucré","riche","crémeux"],
  "Orange Custard Cocktail": ["crémeux","fruité","sucré","riche"],
  "Original Sin": ["herbacé","fruité","complexe","complexe"],
  "Orinoco": ["fruité","acide","rafraîchissant","herbacé"],
  "Orinoco Cocktail": ["tropical","crémeux","sucré","fruité"],
  "Paddington Bear Martini": ["fruité","acide","sucré","léger"],
  "Painkiller": ["tropical","fruité","crémeux","sucré"],
  "Palm Royale Grasshopper": ["crémeux","herbacé","sucré","fruité"],
  "Palo Negro": ["épicé","fumé","acide","complexe"],
  "Paloma": ["acide","fruité","salé","rafraîchissant"],
  "Pan Galactic Gargle Blaster": ["fruité","sucré","acide","complexe"],
  "Paper Plane": ["acide","amer","herbacé","complexe"],
  "Parisian Blond": ["crémeux","fruité","sucré","riche"],
  "Parisian Spring Punch": ["fruité","floral","acide","rafraîchissant"],
  "Parle-vous Irish": ["spirit-forward","herbacé","floral","léger"],
  "Parma Violet (Parma Violet Spritz)": ["floral","sucré","léger","rafraîchissant"],
  "Passion Fruit Margarita": ["fruité","tropical","acide","sucré"],
  "Passion Fruit Martini": ["fruité","tropical","sucré","léger"],
  "Passion Fruit Rum Punch": ["fruité","tropical","sucré","rafraîchissant"],
  "Pastry War Margarita": ["fumé","acide","épicé","rafraîchissant"],
  "Peach & Apricot Spritz": ["fruité","floral","sucré","rafraîchissant"],
  "Peach Me": ["fruité","sucré","acide","rafraîchissant"],
  "Peach Old-fashioned (Wisconsin-style)": ["fruité","sucré","spirit-forward","riche"],
  "Peach Tea": ["fruité","sucré","herbacé","rafraîchissant"],
  "Peat's Dragon": ["fumé","épicé","spirit-forward","complexe"],
  "Penicillin": ["fumé","acide","épicé","complexe"],
  "Perfect Manhattan": ["spirit-forward","amer","herbacé","complexe"],
  "Pernelle": ["floral","fruité","acide","léger"],
  "Peruvian Elder Sour": ["acide","floral","fruité","rafraîchissant"],
  "Picante de la Casa": ["épicé","acide","fruité","rafraîchissant"],
  "Pina Colada": ["tropical","crémeux","fruité","sucré"],
  "Pineapple & Mint Caipirinha": ["fruité","herbacé","acide","rafraîchissant"],
  "Pineapple Martini": ["fruité","tropical","sucré","léger"],
  "Pinecone": ["fruité","acide","herbacé","rafraîchissant"],
  "Pini": ["acide","fruité","floral","léger"],
  "Pink Gin": ["herbacé","amer","épicé","léger"],
  "Pink Gin & Tonic": ["herbacé","amer","floral","rafraîchissant"],
  "Pink Lady": ["fruité","floral","acide","sucré"],
  "Pisco Collins": ["acide","fruité","rafraîchissant","léger"],
  "Pisco Kid": ["acide","fruité","sucré","rafraîchissant"],
  "Pisco Punch": ["fruité","acide","sucré","rafraîchissant"],
  "Pisco Punch (Difford's Recipe)": ["fruité","acide","sucré","rafraîchissant"],
  "Pisco Punch (Micheli's recipe)": ["fruité","acide","sucré","rafraîchissant"],
  "Pisco Punch (Prosser's recipe)": ["fruité","acide","sucré","rafraîchissant"],
  "Pisco Sour": ["acide","sucré","fruité","crémeux"],
  "Pisco Sour (my recipe)": ["acide","fruité","crémeux","sucré"],
  "Planters Punch": ["fruité","tropical","sucré","rafraîchissant"],
  "Playmate Martini": ["fruité","floral","acide","léger"],
  "Polish Martini": ["fruité","sucré","léger","rafraîchissant"],
  "Pooh'tini": ["sucré","floral","fruité","léger"],
  "Pornstar Martini": ["fruité","tropical","sucré","acide"],
  "Port Charlotte": ["fumé","spirit-forward","riche","complexe"],
  "Port of Spain": ["fruité","épicé","tropical","complexe"],
  "Port of Spain (by Dominic Alling)": ["fumé","épicé","herbacé","complexe"],
  "Port of Spain Cocktail": ["spirit-forward","épicé","amer","complexe"],
  "Pot of Gold": ["épicé","sucré","spirit-forward","riche"],
  "Praecocia Cocktail": ["fruité","épicé","sucré","rafraîchissant"],
  "Preakness Manhattan": ["spirit-forward","amer","herbacé","complexe"],
  "Presbyterian": ["épicé","léger","rafraîchissant","spirit-forward"],
  "Prescription Julep": ["herbacé","sucré","rafraîchissant","spirit-forward"],
  "Prince Henry": ["herbacé","fruité","rafraîchissant","léger"],
  "Procrastination Cocktail": ["herbacé","acide","fruité","rafraîchissant"],
  "Psycho Killer Cocktail": ["crémeux","sucré","herbacé","riche"],
  "Pura Vida": ["fumé","amer","sucré","complexe"],
  "Pyramid Punch": ["fruité","floral","acide","rafraîchissant"],
  "Queen's Knees": ["sucré","acide","floral","rafraîchissant"],
  "Queen's Park Hotel Super Cocktail": ["herbacé","épicé","fruité","complexe"],
  "Queen's Park Swizzle": ["herbacé","épicé","rafraîchissant","fruité"],
  "R U Bobby Moore?": ["fumé","spirit-forward","herbacé","complexe"],
  "Rabo-de-Galo": ["amer","spirit-forward","herbacé","complexe"],
  "Ramos Chocolate Fizz": ["crémeux","herbacé","acide","léger"],
  "Ramos Gin Fizz": ["crémeux","floral","acide","léger"],
  "Rapscallion": ["herbacé","acide","fruité","léger"],
  "Raspberry Martini": ["fruité","sucré","acide","floral"],
  "Rattlesnake": ["acide","sucré","herbacé","crémeux"],
  "Red Earl": ["fruité","acide","sucré","rafraîchissant"],
  "Red Hook": ["amer","spirit-forward","complexe","sec"],
  "Red Lion": ["fruité","floral","acide","léger"],
  "Reggae Rum Punch": ["fruité","tropical","sucré","rafraîchissant"],
  "Remember the Maine": ["herbacé","spirit-forward","complexe","fumé"],
  "Renaissance": ["acide","fruité","sucré","complexe"],
  "Rhubarb & Custard": ["acide","sucré","fruité","crémeux"],
  "Rhubarb & Custard Cocktail": ["acide","crémeux","sucré","fruité"],
  "Right Hand": ["amer","spirit-forward","complexe","riche"],
  "Rob Roy": ["spirit-forward","amer","herbacé","complexe"],
  "Rollergirl": ["fruité","sec","herbacé","léger"],
  "Roman Highball": ["épicé","fruité","rafraîchissant","léger"],
  "Rosarita Margarita": ["fruité","acide","sucré","rafraîchissant"],
  "Rose": ["floral","fruité","sucré","léger"],
  "Royal Mojito": ["herbacé","acide","sucré","rafraîchissant"],
  "Ruby": ["fruité","floral","acide","léger"],
  "Ruby Manhattan": ["fruité","spirit-forward","complexe","sucré"],
  "Rude Cosmopolitan": ["fruité","épicé","acide","rafraîchissant"],
  "Rum Punch": ["fruité","tropical","sucré","rafraîchissant"],
  "Rum Swizzle": ["fruité","tropical","acide","rafraîchissant"],
  "Rumshack Punch": ["fruité","tropical","sucré","rafraîchissant"],
  "Russian Spring Punch": ["fruité","acide","sucré","rafraîchissant"],
  "Rusty Nail": ["herbacé","sucré","spirit-forward","riche"],
  "S 'n' Emm": ["fumé","herbacé","acide","complexe"],
  "Sabot": ["herbacé","épicé","acide","complexe"],
  "Sake Manhattan": ["spirit-forward","umami","sec","complexe"],
  "Sake Martini": ["sec","umami","herbacé","léger"],
  "Saketini": ["sec","umami","léger","floral"],
  "Sakini": ["sec","léger","herbacé","umami"],
  "Sakura Martini": ["floral","léger","sec","herbacé"],
  "Salty Dog": ["acide","fruité","salé","rafraîchissant"],
  "Salvatore Meets": ["fruité","acide","tropical","rafraîchissant"],
  "San Francisco (Café Royal)": ["fruité","acide","herbacé","léger"],
  "Sandy The Showgirl": ["fruité","floral","acide","léger"],
  "Sanguinello Cocktail": ["fruité","amer","acide","rafraîchissant"],
  "Sawyer": ["herbacé","acide","fruité","rafraîchissant"],
  "Sazerac": ["amer","herbacé","épicé","spirit-forward"],
  "Sbagliato": ["amer","fruité","rafraîchissant","léger"],
  "Scotch Sour": ["acide","fumé","sucré","rafraîchissant"],
  "Screwdriver": ["fruité","sucré","léger","rafraîchissant"],
  "Sea Breeze": ["fruité","acide","rafraîchissant","léger"],
  "Sex on the Beach": ["fruité","sucré","tropical","rafraîchissant"],
  "Sgroppino Sorbetto": ["acide","fruité","léger","rafraîchissant"],
  "Shaft": ["fruité","sucré","crémeux","riche"],
  "Shark's Tooth No.1 (Trader Vic's)": ["tropical","fruité","acide","complexe"],
  "Sharman-Cox Daiquiri": ["acide","fruité","sucré","rafraîchissant"],
  "Sheroni": ["amer","herbacé","sec","complexe"],
  "Sherry Cobbler": ["fruité","sec","sucré","rafraîchissant"],
  "Sherry Negroni": ["amer","herbacé","sec","complexe"],
  "Sicilian Negroni": ["amer","fruité","herbacé","complexe"],
  "Sidecar": ["acide","sucré","fruité","rafraîchissant"],
  "Sidecar No. Blue": ["acide","fruité","sucré","rafraîchissant"],
  "Silk Stocking Cocktail": ["crémeux","sucré","fruité","épicé"],
  "Sin Cyn cocktail": ["amer","spirit-forward","herbacé","complexe"],
  "Singapore Sling": ["fruité","herbacé","acide","complexe"],
  "Singapore Sling (Dale DeGroff's recipe)": ["fruité","herbacé","acide","complexe"],
  "Sips Sgroppino": ["acide","fruité","rafraîchissant","léger"],
  "Sloe Gin Fizz": ["fruité","acide","sucré","rafraîchissant"],
  "Slow Comfortable Mexican Screw Against The Wall": ["fruité","herbacé","sucré","épicé"],
  "Slow Screw": ["fruité","acide","sucré","rafraîchissant"],
  "Smarties (Smartini)": ["fruité","sucré","léger","crémeux"],
  "Smoke & Mirrors (mezcal-based)": ["fumé","épicé","amer","complexe"],
  "Smokestack Lightning": ["fumé","épicé","acide","complexe"],
  "Snowball": ["crémeux","sucré","fruité","léger"],
  "Sorrentino": ["amer","fruité","acide","complexe"],
  "South Side": ["herbacé","acide","rafraîchissant","léger"],
  "Southside": ["herbacé","acide","rafraîchissant","léger"],
  "Southside Fizz": ["herbacé","acide","rafraîchissant","léger"],
  "Southside Rickey": ["herbacé","acide","rafraîchissant","léger"],
  "Spicy Margarita": ["épicé","acide","salé","rafraîchissant"],
  "Spicy Smoky Margarita": ["fumé","épicé","acide","rafraîchissant"],
  "Spiked Arnold Palmer": ["acide","fruité","sucré","rafraîchissant"],
  "Spring Feeling": ["herbacé","acide","fruité","rafraîchissant"],
  "Spring Fresh Spritz": ["floral","fruité","rafraîchissant","léger"],
  "Spring Green": ["herbacé","sec","léger","fruité"],
  "Spritz": ["amer","fruité","rafraîchissant","léger"],
  "Spritz Veneziano": ["amer","fruité","rafraîchissant","léger"],
  "Spritzer Fresco": ["floral","rafraîchissant","léger","acide"],
  "Stinger": ["herbacé","sucré","rafraîchissant","léger"],
  "Stonage": ["acide","fruité","floral","léger"],
  "Strait of Messina": ["herbacé","acide","fruité","léger"],
  "Strega Chocolate (Accoutrement)": ["herbacé","sucré","riche","complexe"],
  "Suffering Bastard": ["épicé","amer","rafraîchissant","complexe"],
  "Sugar My Plums": ["fruité","sucré","acide","léger"],
  "Summa Peto": ["fruité","tropical","sucré","umami"],
  "Sumo In A Sidecar": ["acide","fruité","umami","complexe"],
  "Sunflower": ["fruité","floral","sucré","léger"],
  "Sunny Disposition": ["fruité","tropical","sucré","rafraîchissant"],
  "Sunset Vibes": ["fruité","tropical","sucré","rafraîchissant"],
  "Sweet Grape Caipirinha": ["fruité","sucré","acide","rafraîchissant"],
  "Sweet Manhattan": ["spirit-forward","sucré","herbacé","riche"],
  "Tequila Alexander": ["crémeux","sucré","épicé","riche"],
  "Tequila Martini": ["sec","spirit-forward","épicé","léger"],
  "Tequila Sunrise": ["fruité","sucré","tropical","léger"],
  "The Addington": ["herbacé","fruité","sucré","léger"],
  "The Angel Wore Red": ["amer","herbacé","épicé","complexe"],
  "The Astor": ["herbacé","acide","fruité","léger"],
  "The Business": ["acide","herbacé","fruité","rafraîchissant"],
  "The Continental Exchange": ["épicé","sucré","spirit-forward","complexe"],
  "The Dante": ["épicé","amer","fruité","complexe"],
  "The Last Word": ["herbacé","acide","fruité","complexe"],
  "The Malagueña": ["fruité","amer","tropical","complexe"],
  "The Mayflower Martini": ["herbacé","floral","léger","sec"],
  "The Moment": ["fruité","tropical","sucré","rafraîchissant"],
  "The Queen's Steeple": ["floral","herbacé","fruité","léger"],
  "The Saint": ["épicé","spirit-forward","complexe","fumé"],
  "The Savelberg": ["herbacé","sucré","acide","floral"],
  "The StiG": ["fruité","acide","sucré","complexe"],
  "There It Is...": ["spirit-forward","amer","herbacé","complexe"],
  "Three Dots and a Dash": ["tropical","fruité","sucré","complexe"],
  "Ti' Punch": ["acide","sucré","spirit-forward","rafraîchissant"],
  "Tiki Max": ["tropical","fruité","sucré","complexe"],
  "Tip Top": ["herbacé","sucré","fruité","léger"],
  "Tiramisu": ["sucré","crémeux","amer","riche"],
  "Tiramisu Cocktail": ["sucré","crémeux","amer","riche"],
  "Tirreno": ["herbacé","amer","floral","léger"],
  "Toblerone": ["sucré","crémeux","riche","fruité"],
  "Tom Collins": ["acide","rafraîchissant","léger","sucré"],
  "Tomatini": ["salé","umami","acide","épicé"],
  "Tommy's Margarita": ["acide","sucré","spirit-forward","rafraîchissant"],
  "Tommy's Mezcal Margarita": ["fumé","acide","sucré","rafraîchissant"],
  "Tootie Fruity (Tootie Fruity Lifesaver)": ["fruité","sucré","acide","léger"],
  "Tootsie Roll": ["sucré","crémeux","spirit-forward","riche"],
  "Toronto": ["amer","herbacé","spirit-forward","complexe"],
  "Touchwood": ["amer","spirit-forward","épicé","complexe"],
  "Tratto Limoncello Cocktail": ["acide","fruité","sucré","rafraîchissant"],
  "Trinidad Sour": ["amer","épicé","acide","complexe"],
  "Triumph of Aniseed": ["herbacé","amer","complexe","complexe"],
  "Turkish Delight (Persepolis)": ["floral","sucré","fruité","riche"],
  "Tuxedo": ["herbacé","spirit-forward","complexe","sec"],
  "Ultima Palabra": ["herbacé","acide","fumé","complexe"],
  "Vacation Martini": ["fruité","sucré","tropical","léger"],
  "Vancouver": ["herbacé","acide","fruité","léger"],
  "Vanessa Polk": ["fruité","tropical","sucré","rafraîchissant"],
  "Vanilla Espresso Martini": ["amer","sucré","crémeux","riche"],
  "Velasco & Sand": ["fumé","fruité","amer","complexe"],
  "Velvet Old Fashioned": ["spirit-forward","sucré","riche","épicé"],
  "VerMillion Fizz": ["fruité","amer","acide","rafraîchissant"],
  "Vesper Dry Martini": ["sec","spirit-forward","herbacé","complexe"],
  "Vieux Carre": ["spirit-forward","amer","herbacé","complexe"],
  "Vivi": ["amer","fruité","rafraîchissant","léger"],
  "Vodka Collins": ["acide","rafraîchissant","léger","sucré"],
  "Vodka Martini": ["sec","spirit-forward","léger","herbacé"],
  "Vodka Stinger": ["herbacé","sucré","rafraîchissant","léger"],
  "Voyager Vodka Martini": ["sec","spirit-forward","léger","herbacé"],
  "Waldorf Cocktail No.1": ["spirit-forward","amer","herbacé","complexe"],
  "Waldorf Daiquiri": ["acide","fruité","crémeux","sucré"],
  "Ward Eight": ["fruité","acide","sucré","rafraîchissant"],
  "Wardroom": ["fruité","herbacé","spirit-forward","complexe"],
  "Warsaw Cooler": ["épicé","acide","fruité","rafraîchissant"],
  "Waters of Chaos": ["herbacé","tropical","acide","complexe"],
  "When The Smoke Cleared": ["fumé","épicé","acide","complexe"],
  "Whiskey Smash": ["herbacé","acide","fruité","rafraîchissant"],
  "Whiskey Sour": ["acide","sucré","fruité","rafraîchissant"],
  "Whisky Butter": ["sucré","riche","spirit-forward","crémeux"],
  "White Lady": ["acide","sucré","fruité","herbacé"],
  "White Negroni": ["amer","floral","herbacé","complexe"],
  "White Russian": ["crémeux","sucré","riche","amer"],
  "Wibble": ["fruité","acide","spirit-forward","complexe"],
  "Widow's Kiss": ["herbacé","fruité","sucré","complexe"],
  "Widows Kiss": ["herbacé","fruité","sucré","complexe"],
  "Wild Blossom": ["floral","herbacé","léger","rafraîchissant"],
  "Winchester": ["spirit-forward","amer","herbacé","complexe"],
  "Winter": ["épicé","fruité","sucré","riche"],
  "Winter Solace": ["épicé","fruité","sucré","riche"],
  "Woo Woo": ["fruité","sucré","acide","rafraîchissant"],
  "Xanthia": ["herbacé","fruité","acide","complexe"],
  "Yellow Belly": ["fruité","acide","sucré","léger"],
  "Yellow Daisy": ["fruité","floral","acide","herbacé"],
  "Yellow Fever": ["fruité","tropical","sucré","léger"],
  "Yellow Negroni": ["amer","herbacé","acide","complexe"],
  "Yule Luv It": ["épicé","sucré","fruité","riche"],
  "Zombie": ["tropical","fruité","complexe","spirit-forward"],
  "Zoom": ["sucré","riche","crémeux","spirit-forward"],
  "Zuzus Petals": ["fruité","sucré","floral","léger"],

  "20th Century Cocktail": ["fruité","floral","acide","herbacé"],
  "Airmail": ["fruité","floral","acide","rafraîchissant"],
  "Alpine Negroni": ["amer","herbacé","spirit-forward","complexe"],
  "Amaretto Stone Sour": ["acide","sucré","fruité","rafraîchissant"],
  "Anejo Manhattan": ["spirit-forward","amer","épicé","complexe"],
  "Banana Daiquiri (shaken)": ["fruité","sucré","acide","rafraîchissant"],
  "Batanga": ["épicé","salé","acide","rafraîchissant"],
  "Bees Knees": ["acide","floral","sucré","rafraîchissant"],
  "Benton's Old Fashioned": ["spirit-forward","fumé","épicé","riche"],
  "Bermondsey Minute": ["herbacé","acide","rafraîchissant","amer"],
  "Black Manhattan": ["spirit-forward","amer","herbacé","complexe"],
  "Blood Orange Garibaldi": ["fruité","amer","acide","rafraîchissant"],
  "Boston Deluxe": ["herbacé","floral","acide","complexe"],
  "Brave Bull": ["sucré","spirit-forward","riche","amer"],
  "Brooklyn (perfect)": ["spirit-forward","amer","herbacé","complexe"],
  "Campari Spritz": ["amer","fruité","rafraîchissant","léger"],
  "Cardinale": ["amer","herbacé","sec","complexe"],
  "Champs-Elysees": ["herbacé","acide","fruité","complexe"],
  "Chartreuse Daisy": ["herbacé","fruité","acide","rafraîchissant"],
  "Chartreuse Sour": ["herbacé","acide","fruité","rafraîchissant"],
  "Ciao Bella": ["crémeux","sucré","fruité","léger"],
  "Clover Club (House-Made)": ["fruité","floral","acide","sucré"],
  "Club Cocktail (my recipe)": ["acide","fruité","floral","léger"],
  "Columbia Skin": ["herbacé","acide","rafraîchissant","léger"],
  "Daisy Buchanan": ["floral","herbacé","léger","rafraîchissant"],
  "Daisy de Santiago": ["herbacé","acide","rafraîchissant","fruité"],
  "Damn It Jimmy": ["spirit-forward","épicé","fumé","complexe"],
  "Dark n Stormy": ["épicé","sucré","rafraîchissant","fruité"],
  "Dead Man's Handle": ["spirit-forward","riche","herbacé","complexe"],
  "Depth Charge": ["spirit-forward","amer","herbacé","complexe"],
  "Dirty Vodka Martini": ["salé","sec","spirit-forward","umami"],
  "Disaronno Fizz": ["sucré","fruité","acide","rafraîchissant"],
  "Division Bell": ["fumé","herbacé","acide","complexe"],
  "Dublin Minstrel": ["spirit-forward","herbacé","fruité","complexe"],
  "El Diablo": ["fruité","épicé","acide","rafraîchissant"],
  "Final Ward": ["herbacé","acide","fruité","complexe"],
  "First Word": ["herbacé","acide","fruité","complexe"],
  "Flannel Shirt": ["spirit-forward","épicé","herbacé","complexe"],
  "French Connection": ["sucré","spirit-forward","riche","fruité"],
  "Gibson": ["sec","spirit-forward","umami","salé"],
  "Gin Blossom Martini": ["floral","herbacé","sec","léger"],
  "Gin Tonic Classique": ["herbacé","amer","rafraîchissant","léger"],
  "Godfather Sour": ["sucré","acide","spirit-forward","fruité"],
  "Honeymoon": ["fruité","herbacé","sucré","complexe"],
  "Honeysuckle": ["floral","sucré","fruité","rafraîchissant"],
  "Hotel Georgia": ["herbacé","fruité","acide","complexe"],
  "Hudson Mule": ["épicé","acide","rafraîchissant","léger"],
  "Iron Negroni": ["amer","herbacé","spirit-forward","complexe"],
  "Kamikaze": ["acide","fruité","sucré","rafraîchissant"],
  "Killer Cocktail": ["amer","fruité","acide","rafraîchissant"],
  "Knickerbocker": ["fruité","tropical","acide","rafraîchissant"],
  "Latest Word": ["herbacé","acide","fruité","complexe"],
  "London Calling": ["fruité","herbacé","acide","rafraîchissant"],
  "Loose Talk": ["herbacé","acide","fruité","complexe"],
  "Madurised Old Fashioned": ["spirit-forward","sucré","riche","épicé"],
  "Maple Sour": ["sucré","acide","spirit-forward","rafraîchissant"],
  "Mexican Mule": ["épicé","acide","rafraîchissant","fruité"],
  "Mezcal Dante": ["fumé","amer","herbacé","complexe"],
  "Milanese G&T": ["herbacé","amer","floral","rafraîchissant"],
  "Milk Punch": ["crémeux","sucré","riche","spirit-forward"],
  "Mississippi Punch": ["fruité","spirit-forward","sucré","complexe"],
  "Monkey's Paw": ["herbacé","acide","fruité","complexe"],
  "Night in Tunisia": ["tropical","fruité","acide","rafraîchissant"],
  "Oaxacan Negroni": ["fumé","amer","herbacé","complexe"],
  "Obituary Martini": ["herbacé","sec","spirit-forward","complexe"],
  "Old Friend": ["amer","fruité","acide","complexe"],
  "Old Gal": ["amer","fruité","herbacé","complexe"],
  "Perfect Negroni": ["amer","herbacé","spirit-forward","complexe"],
  "Pink Daiquiri": ["fruité","floral","acide","rafraîchissant"],
  "Pinky Negroni": ["amer","fruité","herbacé","complexe"],
  "Pippin No.2": ["fruité","herbacé","acide","complexe"],
  "Planter's Punch": ["fruité","tropical","sucré","rafraîchissant"],
  "Poet's Dream": ["herbacé","floral","spirit-forward","complexe"],
  "Porn Star Martini": ["fruité","tropical","sucré","acide"],
  "Preakness": ["spirit-forward","herbacé","amer","complexe"],
  "Presidente": ["fruité","sucré","rafraîchissant","léger"],
  "Psychopathia Sexualis": ["herbacé","acide","fruité","complexe"],
  "Ranch Water": ["acide","épicé","rafraîchissant","léger"],
  "Regent's Punch": ["fruité","tropical","sucré","complexe"],
  "Ritz Sidecar": ["acide","fruité","sucré","rafraîchissant"],
  "Ron Collins": ["fruité","acide","rafraîchissant","sucré"],
  "Royal Bermuda Yacht Club": ["fruité","tropical","acide","rafraîchissant"],
  "Rum Alexander": ["crémeux","sucré","riche","fruité"],
  "Rum Cobbler": ["fruité","sucré","rafraîchissant","léger"],
  "Rum Old Fashioned": ["spirit-forward","épicé","sucré","riche"],
  "Rum Shrub": ["acide","fruité","sucré","rafraîchissant"],
  "Saffron Royale": ["floral","fruité","sucré","léger"],
  "Satan's Whiskers": ["fruité","herbacé","floral","léger"],
  "Savoy Corpse Reviver": ["herbacé","acide","fruité","complexe"],
  "Sazerac Cocktail (Difford's recipe)": ["amer","herbacé","épicé","spirit-forward"],
  "Screaming Orgasm": ["crémeux","sucré","riche","fruité"],
  "Sicilian Kiss": ["sucré","fruité","spirit-forward","riche"],
  "Silk Road": ["floral","herbacé","épicé","complexe"],
  "Sloe Gin Negroni": ["fruité","amer","herbacé","complexe"],
  "Sloegroni": ["fruité","amer","herbacé","complexe"],
  "Smoking Gun": ["fumé","spirit-forward","riche","complexe"],
  "Smoky Cokey": ["fumé","épicé","acide","rafraîchissant"],
  "South Side Rickey": ["herbacé","acide","rafraîchissant","léger"],
  "Swizzle": ["fruité","tropical","acide","rafraîchissant"],
  "Tamarind Margarita": ["acide","fruité","sucré","épicé"],
  "Tequila Old Fashioned": ["spirit-forward","épicé","sucré","riche"],
  "The Broady": ["fruité","épicé","acide","complexe"],
  "The Ribbon": ["amer","fruité","herbacé","léger"],
  "Ti Punch": ["acide","sucré","spirit-forward","rafraîchissant"],
  "Toasted Almond": ["crémeux","sucré","riche","spirit-forward"],
  "Tropical Itch": ["tropical","fruité","sucré","complexe"],
  "Tulip": ["floral","fruité","léger","rafraîchissant"],
  "Turbo Shandy": ["herbacé","amer","léger","rafraîchissant"],
  "Turtle Dove": ["fruité","floral","léger","rafraîchissant"],
  "Valencia": ["fruité","floral","sucré","léger"],
  "Vampiro": ["épicé","fruité","acide","rafraîchissant"],
  "Velocipede": ["herbacé","fruité","acide","complexe"],
  "Venus in Furs": ["herbacé","floral","sec","léger"],
  "Vieux Carré": ["spirit-forward","amer","herbacé","complexe"],
  "Warday's": ["herbacé","fruité","acide","complexe"],
  "Warday's Cocktail": ["herbacé","fruité","acide","complexe"],
  "Whisky Mac": ["épicé","spirit-forward","sucré","riche"],
  "Wild Turkey Sour": ["acide","épicé","sucré","rafraîchissant"],
  "Wordsmith": ["herbacé","acide","fruité","complexe"],
  "Yellow Parrot": ["herbacé","fruité","acide","complexe"],};

const CLASSIC_GROUPS = [
  {
    label: "Spirit-Forward / Amer",
    emoji: "🟤",
    cocktails: ["Old Fashioned","Negroni","Manhattan","Vieux Carré","Sazerac"],
  },
  {
    label: "Herbacé / Floral",
    emoji: "🌿",
    cocktails: ["Martini","Gimlet","Gin Tonic","Singapore Sling"],
  },
  {
    label: "Acide / Citrus",
    emoji: "🍋",
    cocktails: ["Whisky Sour","Margarita","Paloma","Sidecar","Caipirinha","Cosmopolitan"],
  },
  {
    label: "Fruité / Tropical",
    emoji: "🍹",
    cocktails: ["Daiquiri","Mojito","Mai Tai","Pina Colada","Pornstar Martini","Fat Tire","Aperol Spritz"],
  },
  {
    label: "Crémeux / Doux",
    emoji: "☕",
    cocktails: ["Espresso Martini","Alexander"],
  },
  {
    label: "Épicé / Pétillant",
    emoji: "🌶️",
    cocktails: ["Tomatini","Moscow Mule"],
  },
];
const CLASSICS = CLASSIC_GROUPS.flatMap(g => g.cocktails);

const GOUT_OPTIONS = [
  { value:"sucré",    label:"Sucré",           emoji:"🍬" },
  { value:"amer",     label:"Amer",             emoji:"🌿" },
  { value:"acide",    label:"Acide / Citronné", emoji:"🍋" },
  { value:"fruité",   label:"Fruité",           emoji:"🍓" },
  { value:"herbacé",  label:"Herbacé / Floral", emoji:"🌸" },
  { value:"épicé",    label:"Épicé",            emoji:"🌶️" },
  { value:"crémeux",  label:"Crémeux",          emoji:"🥛" },
  { value:"fumé",     label:"Fumé / Tourbé",    emoji:"💨" },
];

const BAR_FAMILIES = [
  { key:"whisky",       label:"Whisky",              emoji:"🥃", members:["Bourbon","Rye Whisky","Scotch Blended","Scotch Single Malt","Irish Whiskey","Japanese Whisky","Tennessee Whiskey"] },
  { key:"gin",          label:"Gin",                 emoji:"🌿", members:["Gin London Dry","Gin Old Tom","Gin Floral","Gin Navy Strength","Sloe Gin"] },
  { key:"vodka",        label:"Vodka",               emoji:"🍸", members:["Vodka","Vodka Citron","Vodka Vanille"] },
  { key:"rhum",         label:"Rhum",                emoji:"🥥", members:["Rhum blanc","Rhum ambré","Rhum noir","Cachaça","Rum Agricole"] },
  { key:"tequila",      label:"Tequila",             emoji:"🌵", members:["Tequila Blanco","Tequila Reposado","Tequila Añejo"] },
  { key:"mezcal",       label:"Mezcal",              emoji:"💨", members:["Mezcal Joven","Mezcal Reposado","Mezcal Añejo"] },
  { key:"cognac",       label:"Cognac / Brandy",     emoji:"🍇", members:["Cognac VSOP","Cognac XO","Armagnac","Calvados","Grappa"] },
  { key:"pisco",        label:"Pisco",               emoji:"🌺", members:["Pisco","Pisco Aromático"] },
  { key:"campari",      label:"Campari",             emoji:"🔴", members:["Campari"], solo:true },
  { key:"aperol",       label:"Aperol",              emoji:"🟠", members:["Aperol"], solo:true },
  { key:"suze",         label:"Suze",                emoji:"💛", members:["Suze"], solo:true },
  { key:"amaro",        label:"Amaro",               emoji:"🍂", members:["Amaro Montenegro","Fernet-Branca","Averna","Ramazzotti","Amaro Nonino","Nardini","Cynar"] },
  { key:"triplesec",    label:"Triple Sec",          emoji:"🍊", members:["Triple Sec","Cointreau","Combier"] },
  { key:"grandmarnier", label:"Grand Marnier",       emoji:"🔶", members:["Grand Marnier"], solo:true },
  { key:"benedictine",  label:"Bénédictine",         emoji:"🌿", members:["Bénédictine"], solo:true },
  { key:"chartreuse_v", label:"Chartreuse Verte",    emoji:"💚", members:["Chartreuse Verte"], solo:true },
  { key:"chartreuse_j", label:"Chartreuse Jaune",    emoji:"💛", members:["Chartreuse Jaune"], solo:true },
  { key:"creme_cacao",  label:"Crème de Cacao",      emoji:"🍫", members:["Crème de Cacao blanc","Crème de Cacao brun"] },
  { key:"maraschino",   label:"Maraschino",          emoji:"🍒", members:["Maraschino Luxardo","Maraschino générique"] },
  { key:"stgermain",    label:"Elderflower (St-Germain)", emoji:"🌸", members:["St-Germain (Elderflower)"], solo:true },
  { key:"fruitleq",     label:"Liqueurs de fruits",  emoji:"🫐", members:["Chambord","Passoa","Midori","Limoncello","Crème de Cassis","Apricot Brandy","Crème de Pêche","Liqueur de cerise (Cherry Heering)","Crème de banane","Crème de mûre","Crème de fraise","Crème de framboise","Crème de menthe","Peach Schnapps","Mango liqueur","Falernum liqueur","Crème de Violette","Italicus (Bergamote)"], accordion:true },
  { key:"kahlualeq",    label:"Kahlúa",              emoji:"☕", members:["Kahlúa","Tia Maria"] },
  { key:"amaretto",     label:"Amaretto",            emoji:"🍒", members:["Amaretto Disaronno","Luxardo Amaretto"] },
  { key:"baileys",      label:"Baileys",             emoji:"🍦", members:["Baileys","Advocaat"] },
  { key:"frangelico",   label:"Frangelico",          emoji:"🌰", members:["Frangelico"], solo:true },
  { key:"vermrouge",    label:"Vermouth Rouge",      emoji:"🍷", members:["Vermouth Rouge","Carpano Antica","Punt e Mes"] },
  { key:"vermsec",      label:"Vermouth Sec",        emoji:"⬜", members:["Vermouth Sec","Noilly Prat","Dolin Dry"] },
  { key:"vermblanc",    label:"Vermouth Blanc",      emoji:"🌼", members:["Vermouth Blanc","Martini Bianco","Dolin Blanc"] },
  { key:"lillet",       label:"Lillet",              emoji:"🌼", members:["Lillet Blanc","Lillet Rouge"] },
  { key:"sherry",       label:"Sherry",              emoji:"🍶", members:["Sherry Fino","Sherry Manzanilla","Sherry Amontillado","Sherry Oloroso"] },
  { key:"port",         label:"Port",                emoji:"🍷", members:["Port Tawny","Port Ruby","Port LBV"] },
  { key:"vinblanc",     label:"Vin blanc",           emoji:"🥂", members:["Vin blanc sec","Vin blanc doux"], solo:false },
  { key:"sake",         label:"Saké",                emoji:"🍶", members:["Saké"], solo:true },
  { key:"effervescent", label:"Vins effervescents",  emoji:"🥂", members:["Prosecco","Champagne","Crémant","Cava"] },
  { key:"absinthe",     label:"Absinthe",            emoji:"💚", members:["Absinthe","Pastis"] },
  { key:"drambuie",     label:"Drambuie",            emoji:"🍯", members:["Drambuie"] },
];

const BAR_INVENTORY = {
  alcools: BAR_FAMILIES.flatMap(f => f.members),
  sirops: [
    "Sucre de canne","Sirop d'agave","Miel (sirop)","Sirop d'érable","Sirop de sucre brun",
    "Grenadine","Sirop de framboise","Sirop de fraise","Sirop de pêche","Sirop de mangue",
    "Sirop de passion","Sirop de sureau","Sirop de rose","Sirop de lavande","Sirop de violette",
    "Sirop de gingembre","Sirop de cannelle","Sirop de vanille","Orgeat","Falernum","Sirop de coco","Sirop de safran",
  ],
  bitters: [
    "Angostura Bitters","Orange Bitters","Peychaud's Bitters","Chocolate Bitters",
    "Celery Bitters","Grapefruit Bitters","Mole Bitters","Cardamom Bitters","Lavender Bitters",
    "Cherry Bitters","Almond Bitters",
  ],
  frigo: [
    "Blanc d'œuf","Crème fraîche","Lait entier",
    "Jus de pamplemousse","Jus d'ananas","Jus de cranberry","Jus d'orange","Jus de tomate","Jus de pomme",
    "Eau gazeuse","Tonic Water","Ginger Ale","Ginger Beer","Cola",
    "Espresso","Menthe fraîche","Concombre","Basilic frais",
    "Fraises","Framboises","Lait de coco","Crème de coco","Saumure d'olive",
  ],
};

const CAT_LABELS = {
  alcools: { label:"Alcools & Liqueurs", emoji:"🍶" },
  sirops:  { label:"Sirops & Sucrants",  emoji:"🍯" },
  bitters: { label:"Bitters",            emoji:"🧪" },
  frigo:   { label:"Frigo / Frais",      emoji:"🧊" },
};

const EMPTY_STOCK = {
  alcools:[], sirops:[], bitters:[], frigo:[],
  custom_alcools:[], custom_sirops:[], custom_bitters:[], custom_frigo:[],
};

// ── Cocktail Database ──────────────────────────────────────────────────────
const COCKTAIL_DB = [
  // OLD FASHIONED family
  { name:"Old Fashioned", classique:"Old Fashioned", variation:"classique", emoji:"🥃", description:"Bourbon, sucre, Angostura bitters, zeste d'orange", ingredients:["Bourbon","Sucre de canne","Angostura Bitters"], tags:["whisky","spirit-forward","amer","sucré"] },
  { name:"Mezcal Old Fashioned", classique:"Old Fashioned", variation:"variation", emoji:"🌶️", description:"Mezcal, agave, mole bitters, zeste d'orange fumé", ingredients:["Mezcal","Sirop d'agave","Mole Bitters"], tags:["mezcal","spirit-forward","amer","fumé"] },
  { name:"Toronto", classique:"Old Fashioned", variation:"variation", emoji:"🍂", description:"Rye whisky, Fernet-Branca, sucre, Angostura", ingredients:["Rye Whisky","Fernet-Branca","Sucre de canne","Angostura Bitters"], tags:["whisky","spirit-forward","amer","herbacé"] },
  { name:"Oaxacan Old Fashioned", classique:"Old Fashioned", variation:"variation", emoji:"🌵", description:"Tequila reposado, Mezcal, agave, mole bitters", ingredients:["Tequila Reposado","Mezcal","Sirop d'agave","Mole Bitters"], tags:["tequila","mezcal","spirit-forward","amer","fumé"] },
  { name:"Rum Old Fashioned", classique:"Old Fashioned", variation:"variation", emoji:"🍫", description:"Rhum noir, sucre de canne, Angostura, zeste d'orange", ingredients:["Rhum noir","Sucre de canne","Angostura Bitters"], tags:["rhum","spirit-forward","amer","sucré"] },
  { name:"Brandy Old Fashioned", classique:"Old Fashioned", variation:"variation", emoji:"🍇", description:"Cognac, sucre, Angostura bitters, zeste d'orange", ingredients:["Cognac VSOP","Sucre de canne","Angostura Bitters"], tags:["cognac","spirit-forward","amer","sucré"] },
  { name:"Revolver", classique:"Old Fashioned", variation:"variation", emoji:"☕", description:"Bourbon, Kahlúa, orange bitters, zeste d'orange", ingredients:["Bourbon","Kahlúa","Orange Bitters"], tags:["whisky","café","spirit-forward","amer","sucré"] },
  // NEGRONI family
  { name:"Negroni", classique:"Negroni", variation:"classique", emoji:"🍊", description:"Gin, Campari, Vermouth rouge, zeste d'orange", ingredients:["Gin London Dry","Campari","Vermouth Rouge"], tags:["gin","amer","campari","vermouth","spirit-forward"] },
  { name:"Boulevardier", classique:"Negroni", variation:"variation", emoji:"🍒", description:"Bourbon, Campari, Vermouth rouge", ingredients:["Bourbon","Campari","Vermouth Rouge"], tags:["whisky","amer","campari","vermouth","spirit-forward"] },
  { name:"Sbagliato", classique:"Negroni", variation:"variation", emoji:"🥂", description:"Campari, Vermouth rouge, Prosecco", ingredients:["Campari","Vermouth Rouge","Prosecco"], tags:["pétillant","amer","campari","léger"] },
  { name:"Jungle Bird", classique:"Negroni", variation:"variation", emoji:"🦜", description:"Rhum noir, Campari, jus d'ananas, citron vert, sucre", ingredients:["Rhum noir","Campari","Jus d'ananas","Sucre de canne"], tags:["rhum","amer","campari","fruité","tropical"] },
  { name:"White Negroni", classique:"Negroni", variation:"variation", emoji:"⬜", description:"Gin, Lillet Blanc, Suze — version pâle et florale", ingredients:["Gin London Dry","Lillet Blanc","Suze"], tags:["gin","floral","amer","sec","élégant"] },
  { name:"Mezcal Negroni", classique:"Negroni", variation:"variation", emoji:"💨", description:"Mezcal, Campari, Vermouth rouge — version fumée", ingredients:["Mezcal","Campari","Vermouth Rouge"], tags:["mezcal","amer","campari","fumé","spirit-forward"] },
  { name:"Old Pal", classique:"Negroni", variation:"variation", emoji:"🥃", description:"Rye whisky, Campari, Vermouth sec", ingredients:["Rye Whisky","Campari","Vermouth Sec"], tags:["whisky","amer","campari","vermouth","spirit-forward"] },
  { name:"Cardinale", classique:"Negroni", variation:"variation", emoji:"🔴", description:"Gin, Campari, Vermouth sec — version plus sèche", ingredients:["Gin London Dry","Campari","Vermouth Sec"], tags:["gin","amer","campari","sec","spirit-forward"] },
  // MARTINI family
  { name:"Dry Martini", classique:"Martini", variation:"classique", emoji:"🫒", description:"Gin, Vermouth sec, olive ou zeste de citron", ingredients:["Gin London Dry","Vermouth Sec"], tags:["gin","sec","vermouth","spirit-forward","élégant"] },
  { name:"Dirty Martini", classique:"Martini", variation:"variation", emoji:"🫒", description:"Gin ou Vodka, Vermouth sec, saumure d'olive", ingredients:["Gin London Dry","Vermouth Sec","Saumure d'olive"], tags:["gin","sec","vermouth","salé","spirit-forward"] },
  { name:"Last Word", classique:"Martini", variation:"variation", emoji:"🌿", description:"Gin, Green Chartreuse, Maraschino, citron vert", ingredients:["Gin London Dry","Chartreuse Verte","Maraschino"], tags:["gin","herbacé","citrus","équilibré"] },
  { name:"Gimlet", classique:"Martini", variation:"variation", emoji:"🌿", description:"Gin, jus de citron vert frais, sirop de canne", ingredients:["Gin London Dry","Sucre de canne"], tags:["gin","citrus","frais","acide"] },
  { name:"Bamboo", classique:"Martini", variation:"variation", emoji:"🎋", description:"Dry Sherry, Vermouth sec, Angostura, orange bitters", ingredients:["Dry Sherry","Vermouth Sec","Angostura Bitters","Orange Bitters"], tags:["sherry","sec","vermouth","léger"] },
  { name:"Vesper Martini", classique:"Martini", variation:"variation", emoji:"🔱", description:"Gin, Vodka, Lillet Blanc — le Martini de James Bond", ingredients:["Gin London Dry","Vodka","Lillet Blanc"], tags:["gin","vodka","sec","élégant","spirit-forward"] },
  { name:"Martinez", classique:"Martini", variation:"variation", emoji:"🍒", description:"Gin vieilli, Vermouth rouge, Maraschino, Angostura", ingredients:["Gin Old Tom","Vermouth Rouge","Maraschino","Angostura Bitters"], tags:["gin","vermouth","doux","spirit-forward"] },
  // ESPRESSO MARTINI family
  { name:"Espresso Martini", classique:"Espresso Martini", variation:"classique", emoji:"☕", description:"Vodka, Kahlúa, espresso frais, sucre", ingredients:["Vodka","Kahlúa","Espresso","Sucre de canne"], tags:["vodka","café","crémeux","sucré"] },
  { name:"White Russian", classique:"Espresso Martini", variation:"variation", emoji:"🥛", description:"Vodka, Kahlúa, crème fraîche sur glace", ingredients:["Vodka","Kahlúa","Crème fraîche"], tags:["vodka","café","crémeux","sucré"] },
  { name:"Irish Coffee", classique:"Espresso Martini", variation:"variation", emoji:"☘️", description:"Whisky irlandais, café chaud, sucre, crème fouettée", ingredients:["Irish Whiskey","Espresso","Crème fraîche","Sucre de canne"], tags:["whisky","café","crémeux","chaud","sucré"] },
  { name:"Espresso Martini Noisette", classique:"Espresso Martini", variation:"variation", emoji:"🌰", description:"Vodka, Frangelico, espresso, crème de noisette", ingredients:["Vodka","Frangelico","Espresso"], tags:["vodka","café","noisette","crémeux","sucré"] },
  // PISCO SOUR family
  { name:"Pisco Sour", classique:"Pisco Sour", variation:"classique", emoji:"🍋", description:"Pisco, citron vert, sucre, blanc d'œuf, Angostura", ingredients:["Pisco","Sucre de canne","Blanc d'œuf","Angostura Bitters"], tags:["pisco","sour","citrus","mousseux","équilibré"] },
  { name:"Whisky Sour", classique:"Pisco Sour", variation:"variation", emoji:"🥃", description:"Whisky, citron frais, sucre, blanc d'œuf, Angostura", ingredients:["Bourbon","Sucre de canne","Blanc d'œuf","Angostura Bitters"], tags:["whisky","sour","citrus","mousseux"] },
  { name:"Amaretto Sour", classique:"Pisco Sour", variation:"variation", emoji:"🍒", description:"Amaretto, citron frais, blanc d'œuf", ingredients:["Amaretto","Blanc d'œuf"], tags:["amaretto","sour","citrus","mousseux","sucré"] },
  { name:"Clover Club", classique:"Pisco Sour", variation:"variation", emoji:"🫐", description:"Gin, framboise, citron, blanc d'œuf, sucre", ingredients:["Gin London Dry","Sirop de framboise","Blanc d'œuf","Sucre de canne"], tags:["gin","sour","fruité","mousseux","floral"] },
  { name:"New York Sour", classique:"Pisco Sour", variation:"variation", emoji:"🍷", description:"Bourbon, citron, sucre, blanc d'œuf, flottant de vin rouge", ingredients:["Bourbon","Sucre de canne","Blanc d'œuf"], tags:["whisky","sour","citrus","mousseux","vineux"] },
  { name:"Tequila Sour", classique:"Pisco Sour", variation:"variation", emoji:"🌵", description:"Tequila, citron vert, sucre, blanc d'œuf", ingredients:["Tequila Blanco","Sucre de canne","Blanc d'œuf"], tags:["tequila","sour","citrus","mousseux","frais"] },
  // MARGARITA family
  { name:"Margarita", classique:"Margarita", variation:"classique", emoji:"🍋", description:"Tequila, Triple Sec, citron vert frais, sel sur le bord", ingredients:["Tequila Blanco","Triple Sec"], tags:["tequila","citrus","acide","frais","sel"] },
  { name:"Tommy's Margarita", classique:"Margarita", variation:"variation", emoji:"🌵", description:"Tequila reposado, citron vert, sirop d'agave", ingredients:["Tequila Reposado","Sirop d'agave"], tags:["tequila","citrus","acide","naturel"] },
  { name:"Paloma", classique:"Margarita", variation:"variation", emoji:"🍊", description:"Tequila, pamplemousse, citron vert, sel, eau gazeuse", ingredients:["Tequila Blanco","Eau gazeuse"], tags:["tequila","citrus","pétillant","fruité","frais"] },
  { name:"Spicy Margarita", classique:"Margarita", variation:"variation", emoji:"🌶️", description:"Tequila, citron vert, Triple Sec, jalapeño frais", ingredients:["Tequila Blanco","Triple Sec"], tags:["tequila","citrus","épicé","intense"] },
  { name:"Mezcal Margarita", classique:"Margarita", variation:"variation", emoji:"💨", description:"Mezcal, citron vert, Triple Sec, sel fumé", ingredients:["Mezcal","Triple Sec"], tags:["mezcal","citrus","fumé","acide","intense"] },
  { name:"Watermelon Margarita", classique:"Margarita", variation:"variation", emoji:"🍉", description:"Tequila, jus de pastèque, citron vert, Triple Sec", ingredients:["Tequila Blanco","Triple Sec"], tags:["tequila","fruité","citrus","sucré","estival"] },
  // GIN TONIC family
  { name:"Gin Tonic Classique", classique:"Gin Tonic", variation:"classique", emoji:"🌿", description:"Gin, tonic premium, glaçons, zeste de citron", ingredients:["Gin London Dry","Tonic Water"], tags:["gin","tonic","pétillant","amer","frais"] },
  { name:"Gin Tonic Floral", classique:"Gin Tonic", variation:"variation", emoji:"🌺", description:"Gin floral, tonic elderflower, concombre, fleurs", ingredients:["Gin Floral","Tonic Water","Concombre"], tags:["gin","tonic","pétillant","floral","léger"] },
  { name:"Gin Tonic Agrume", classique:"Gin Tonic", variation:"variation", emoji:"🍋", description:"Gin cédrat, tonic citrus, zeste de pamplemousse", ingredients:["Gin London Dry","Tonic Water"], tags:["gin","tonic","pétillant","citrus","frais"] },
  { name:"Gin Tonic Épicé", classique:"Gin Tonic", variation:"variation", emoji:"🌶️", description:"Gin, tonic, gingembre, citron vert, piment", ingredients:["Gin London Dry","Tonic Water","Ginger Ale"], tags:["gin","tonic","épicé","frais","intense"] },
  { name:"Gin Tonic Rose", classique:"Gin Tonic", variation:"variation", emoji:"🌹", description:"Gin, tonic rosé, framboise, pétales de rose", ingredients:["Gin Floral","Tonic Water","Sirop de framboise"], tags:["gin","tonic","floral","fruité","sucré"] },
  // COSMOPOLITAN family
  { name:"Cosmopolitan", classique:"Cosmopolitan", variation:"classique", emoji:"🍸", description:"Vodka citron, Triple Sec, jus de cranberry, citron vert", ingredients:["Vodka Citron","Triple Sec","Jus de cranberry"], tags:["vodka","citrus","fruité","frais","élégant"] },
  { name:"French Martini", classique:"Cosmopolitan", variation:"variation", emoji:"🫐", description:"Vodka, Chambord, jus d'ananas frais", ingredients:["Vodka","Chambord","Jus d'ananas"], tags:["vodka","fruité","sucré","violet"] },
  { name:"Kamikaze", classique:"Cosmopolitan", variation:"variation", emoji:"💥", description:"Vodka, Triple Sec, citron vert", ingredients:["Vodka","Triple Sec"], tags:["vodka","citrus","acide","simple"] },
  { name:"Lemon Drop", classique:"Cosmopolitan", variation:"variation", emoji:"🍋", description:"Vodka citron, Triple Sec, jus de citron, sucre", ingredients:["Vodka Citron","Triple Sec","Sucre de canne"], tags:["vodka","citrus","acide","sucré","frais"] },
  // PORNSTAR MARTINI family
  { name:"Pornstar Martini", classique:"Pornstar Martini", variation:"classique", emoji:"🌟", description:"Vodka vanille, Passoa, purée de mangue, citron, Prosecco", ingredients:["Vodka Vanille","Passoa","Prosecco"], tags:["vodka","tropical","fruité","sucré","pétillant"] },
  { name:"Passionfruit Daiquiri", classique:"Pornstar Martini", variation:"variation", emoji:"🍹", description:"Rhum blanc, fruit de la passion, citron vert, sucre", ingredients:["Rhum blanc","Passoa","Sucre de canne"], tags:["rhum","tropical","fruité","citrus","frais"] },
  { name:"Pina Colada", classique:"Pornstar Martini", variation:"variation", emoji:"🍍", description:"Rhum blanc, lait de coco, ananas, glace pilée", ingredients:["Rhum blanc","Lait de coco","Jus d'ananas"], tags:["rhum","tropical","crémeux","sucré","fruité"] },
  { name:"Lychee Martini", classique:"Pornstar Martini", variation:"variation", emoji:"🍈", description:"Vodka, liqueur de lychee, jus de citron vert", ingredients:["Vodka","Sucre de canne"], tags:["vodka","fruité","floral","sucré","exotique"] },
  // GIN FIZZ family
  { name:"Gin Fizz Classique", classique:"Gin Fizz", variation:"classique", emoji:"🥂", description:"Gin, citron frais, sucre, eau gazeuse", ingredients:["Gin London Dry","Sucre de canne","Eau gazeuse"], tags:["gin","citrus","pétillant","frais","long"] },
  { name:"French 75", classique:"Gin Fizz", variation:"variation", emoji:"🥂", description:"Gin, citron frais, sucre, Champagne", ingredients:["Gin London Dry","Sucre de canne","Champagne"], tags:["gin","citrus","pétillant","élégant"] },
  { name:"Bee's Knees", classique:"Gin Fizz", variation:"variation", emoji:"🐝", description:"Gin, citron frais, miel", ingredients:["Gin London Dry","Miel (sirop)"], tags:["gin","citrus","miel","frais"] },
  { name:"Aviation", classique:"Gin Fizz", variation:"variation", emoji:"✈️", description:"Gin, Maraschino, crème de violette, citron", ingredients:["Gin London Dry","Maraschino"], tags:["gin","floral","citrus","élégant","violet"] },
  { name:"South Side", classique:"Gin Fizz", variation:"variation", emoji:"🌿", description:"Gin, citron frais, sucre, menthe fraîche", ingredients:["Gin London Dry","Sucre de canne","Menthe fraîche"], tags:["gin","herbacé","citrus","frais","menthe"] },
  { name:"Ramos Gin Fizz", classique:"Gin Fizz", variation:"variation", emoji:"🌸", description:"Gin, citron, lime, sucre, crème, blanc d'œuf, eau gazeuse", ingredients:["Gin London Dry","Sucre de canne","Crème fraîche","Blanc d'œuf","Eau gazeuse"], tags:["gin","citrus","crémeux","mousseux","pétillant"] },
  // TOMATINI family
  { name:"Tomatini", classique:"Tomatini", variation:"classique", emoji:"🍅", description:"Vodka, jus de tomate épicé, citron, Worcester, Tabasco", ingredients:["Vodka","Jus de tomate"], tags:["vodka","tomate","épicé","umami","salé"] },
  { name:"Bloody Mary", classique:"Tomatini", variation:"variation", emoji:"🍅", description:"Vodka, jus de tomate, citron, Worcester, Tabasco, céleri", ingredients:["Vodka","Jus de tomate"], tags:["vodka","tomate","épicé","umami","long"] },
  { name:"Red Snapper", classique:"Tomatini", variation:"variation", emoji:"🐟", description:"Gin au lieu de vodka, jus de tomate, épices", ingredients:["Gin London Dry","Jus de tomate"], tags:["gin","tomate","épicé","herbacé","umami"] },
  { name:"Bloody Caesar", classique:"Tomatini", variation:"variation", emoji:"🦪", description:"Vodka, Clamato, Tabasco, Worcester — version canadienne", ingredients:["Vodka","Jus de tomate"], tags:["vodka","tomate","umami","épicé","brunch"] },
  // VIEUX CARRÉ family
  { name:"Vieux Carré", classique:"Vieux Carré", variation:"classique", emoji:"🥃", description:"Rye, Cognac, Vermouth rouge, Bénédictine, bitters", ingredients:["Rye Whisky","Cognac VSOP","Vermouth Rouge","Bénédictine","Angostura Bitters"], tags:["whisky","cognac","vermouth","amer","complexe","spirit-forward"] },
  { name:"Manhattan", classique:"Vieux Carré", variation:"variation", emoji:"🍒", description:"Rye whisky, Vermouth rouge, Angostura bitters", ingredients:["Rye Whisky","Vermouth Rouge","Angostura Bitters"], tags:["whisky","vermouth","amer","élégant","spirit-forward"] },
  { name:"Rob Roy", classique:"Vieux Carré", variation:"variation", emoji:"🏴󠁧󠁢󠁳󠁣󠁴󠁿", description:"Scotch, Vermouth rouge, Angostura bitters", ingredients:["Scotch Blended","Vermouth Rouge","Angostura Bitters"], tags:["whisky","vermouth","amer","fumé","spirit-forward"] },
  { name:"Brooklyn", classique:"Vieux Carré", variation:"variation", emoji:"🌉", description:"Rye whisky, Vermouth sec, Maraschino", ingredients:["Rye Whisky","Vermouth Sec","Maraschino"], tags:["whisky","vermouth","amer","sec","spirit-forward"] },
  { name:"Red Hook", classique:"Vieux Carré", variation:"variation", emoji:"🔴", description:"Rye whisky, Vermouth rouge, Maraschino", ingredients:["Rye Whisky","Vermouth Rouge","Maraschino"], tags:["whisky","vermouth","amer","complexe","spirit-forward"] },
  // DAIQUIRI family
  { name:"Daiquiri Classique", classique:"Daiquiri", variation:"classique", emoji:"🥥", description:"Rhum blanc, citron vert frais, sucre de canne", ingredients:["Rhum blanc","Sucre de canne"], tags:["rhum","citrus","frais","simple","acide"] },
  { name:"Daiquiri Fraise", classique:"Daiquiri", variation:"variation", emoji:"🍓", description:"Rhum blanc, fraises fraîches, citron vert, sucre", ingredients:["Rhum blanc","Sucre de canne","Fraises"], tags:["rhum","citrus","fruité","frais","sucré"] },
  { name:"Hemingway Daiquiri", classique:"Daiquiri", variation:"variation", emoji:"✍️", description:"Rhum blanc, pamplemousse, Maraschino, citron vert", ingredients:["Rhum blanc","Maraschino"], tags:["rhum","citrus","sec","complexe"] },
  { name:"Mojito", classique:"Daiquiri", variation:"variation", emoji:"🌿", description:"Rhum blanc, menthe, citron vert, sucre, eau gazeuse", ingredients:["Rhum blanc","Sucre de canne","Eau gazeuse","Menthe fraîche"], tags:["rhum","herbacé","citrus","pétillant","frais"] },
  { name:"Airmail", classique:"Daiquiri", variation:"variation", emoji:"✈️", description:"Rhum blanc, citron vert, miel, Champagne", ingredients:["Rhum blanc","Miel (sirop)","Champagne"], tags:["rhum","citrus","pétillant","élégant","miel"] },
  { name:"El Presidente", classique:"Daiquiri", variation:"variation", emoji:"🇨🇺", description:"Rhum blanc, Vermouth blanc, Triple Sec, grenadine", ingredients:["Rhum blanc","Vermouth Blanc","Triple Sec","Grenadine"], tags:["rhum","citrus","élégant","sucré","spirit-forward"] },
];

// ── Embedded Recipes ───────────────────────────────────────────────────────
const RECIPES = {
  "Old Fashioned":        { glass:"Verre Old Fashioned", method:"Direct", garnish:"Zeste d'orange", instructions:"Dissoudre le sucre avec les bitters au fond du verre. Ajouter le bourbon et les glaçons. Remuer délicatement. Exprimer le zeste d'orange sur le verre.", ingredients:[{amount:"60ml",name:"Bourbon"},{amount:"1 trait",name:"Angostura bitters"},{amount:"1 cube",name:"Sucre"},{amount:"1 trait",name:"Eau"}] },
  "Negroni":              { glass:"Verre Old Fashioned", method:"Verre mélangeur", garnish:"Zeste d'orange", instructions:"Mélanger tous les ingrédients avec de la glace dans un verre mélangeur. Filtrer sur un gros glaçon. Exprimer le zeste d'orange.", ingredients:[{amount:"30ml",name:"Gin"},{amount:"30ml",name:"Campari"},{amount:"30ml",name:"Vermouth rouge"}] },
  "Dry Martini":          { glass:"Coupe ou verre Martini", method:"Verre mélangeur", garnish:"Olive ou zeste de citron", instructions:"Refroidir le verre. Mélanger gin et vermouth avec de la glace. Filtrer dans le verre froid.", ingredients:[{amount:"60ml",name:"Gin"},{amount:"10ml",name:"Vermouth sec"}] },
  "Espresso Martini":     { glass:"Coupe", method:"Shaker", garnish:"3 grains de café", instructions:"Shaker vigoureusement tous les ingrédients avec de la glace pour créer une mousse. Double filtration dans une coupe froide.", ingredients:[{amount:"50ml",name:"Vodka"},{amount:"20ml",name:"Kahlúa"},{amount:"30ml",name:"Espresso frais"},{amount:"5ml",name:"Sucre de canne"}] },
  "Pisco Sour":           { glass:"Coupe", method:"Shaker", garnish:"Angostura bitters en trait", instructions:"Dry shake sans glace pour émulsionner le blanc d'œuf. Ajouter la glace, shaker à nouveau. Double filtration. Décorer avec quelques traits d'Angostura.", ingredients:[{amount:"60ml",name:"Pisco"},{amount:"30ml",name:"Jus de citron vert"},{amount:"20ml",name:"Sucre de canne"},{amount:"1",name:"Blanc d'œuf"},{amount:"2 traits",name:"Angostura bitters"}] },
  "Margarita":            { glass:"Verre Margarita ou coupe", method:"Shaker", garnish:"Sel sur le bord, rondelle de citron vert", instructions:"Givrer le bord du verre avec du sel. Shaker tous les ingrédients avec de la glace. Filtrer.", ingredients:[{amount:"50ml",name:"Tequila"},{amount:"25ml",name:"Triple Sec"},{amount:"25ml",name:"Jus de citron vert frais"}] },
  "Gin Tonic Classique":  { glass:"Ballon ou Highball", method:"Direct", garnish:"Zeste de citron ou concombre", instructions:"Remplir le verre de glaçons. Verser le gin. Compléter avec le tonic en le faisant couler sur une cuillère.", ingredients:[{amount:"50ml",name:"Gin"},{amount:"150ml",name:"Tonic premium"}] },
  "Cosmopolitan":         { glass:"Coupe ou verre Martini", method:"Shaker", garnish:"Zeste de citron flambé", instructions:"Shaker tous les ingrédients avec de la glace. Double filtration dans un verre froid. Flamber le zeste de citron.", ingredients:[{amount:"40ml",name:"Vodka citron"},{amount:"15ml",name:"Triple Sec"},{amount:"30ml",name:"Jus de cranberry"},{amount:"15ml",name:"Jus de citron vert frais"}] },
  "Pornstar Martini":     { glass:"Coupe + shot de Prosecco", method:"Shaker", garnish:"Demi fruit de la passion", instructions:"Shaker vodka, Passoa, purée de mangue et citron avec glace. Filtrer dans la coupe. Servir avec un shot de Prosecco à côté.", ingredients:[{amount:"50ml",name:"Vodka vanille"},{amount:"20ml",name:"Passoa"},{amount:"20ml",name:"Purée de mangue"},{amount:"15ml",name:"Jus de citron"},{amount:"50ml",name:"Prosecco (shot à côté)"}] },
  "Gin Fizz Classique":   { glass:"Highball", method:"Shaker", garnish:"Rondelle de citron", instructions:"Shaker gin, citron et sucre avec glace. Filtrer dans le verre. Compléter avec l'eau gazeuse. Ne pas remuer.", ingredients:[{amount:"50ml",name:"Gin"},{amount:"25ml",name:"Jus de citron frais"},{amount:"15ml",name:"Sucre de canne"},{amount:"75ml",name:"Eau gazeuse"}] },
  "Tomatini":             { glass:"Coupe ou verre Martini", method:"Shaker", garnish:"Tomate cerise et céleri", instructions:"Shaker tous les ingrédients avec glace. Double filtration dans le verre froid.", ingredients:[{amount:"50ml",name:"Vodka"},{amount:"60ml",name:"Jus de tomate épicé"},{amount:"10ml",name:"Jus de citron"},{amount:"2 traits",name:"Sauce Worcester"},{amount:"1 trait",name:"Tabasco"}] },
  "Vieux Carré":          { glass:"Verre Old Fashioned", method:"Verre mélangeur", garnish:"Zeste de citron et cerise", instructions:"Mélanger tous les ingrédients avec de la glace dans un verre mélangeur. Filtrer sur un gros glaçon.", ingredients:[{amount:"30ml",name:"Rye whisky"},{amount:"30ml",name:"Cognac"},{amount:"30ml",name:"Vermouth rouge"},{amount:"5ml",name:"Bénédictine"},{amount:"2 traits",name:"Angostura bitters"}] },
  "Daiquiri Classique":   { glass:"Coupe", method:"Shaker", garnish:"Rondelle de citron vert", instructions:"Shaker vigoureusement tous les ingrédients avec de la glace. Double filtration dans une coupe froide.", ingredients:[{amount:"60ml",name:"Rhum blanc"},{amount:"25ml",name:"Jus de citron vert frais"},{amount:"15ml",name:"Sucre de canne"}] },
  "Boulevardier":         { glass:"Verre Old Fashioned", method:"Verre mélangeur", garnish:"Cerise ou zeste d'orange", instructions:"Mélanger au verre mélangeur avec glace. Filtrer sur glaçon.", ingredients:[{amount:"45ml",name:"Bourbon"},{amount:"30ml",name:"Campari"},{amount:"30ml",name:"Vermouth rouge"}] },
  "Sbagliato":            { glass:"Verre Old Fashioned", method:"Direct", garnish:"Tranche d'orange", instructions:"Verser Campari et Vermouth sur glace. Compléter avec le Prosecco. Remuer délicatement.", ingredients:[{amount:"30ml",name:"Campari"},{amount:"30ml",name:"Vermouth rouge"},{amount:"60ml",name:"Prosecco"}] },
  "White Negroni":        { glass:"Coupe", method:"Verre mélangeur", garnish:"Zeste de citron", instructions:"Mélanger au verre mélangeur avec glace. Double filtration dans une coupe froide.", ingredients:[{amount:"45ml",name:"Gin"},{amount:"20ml",name:"Lillet Blanc"},{amount:"20ml",name:"Suze"}] },
  "Manhattan":            { glass:"Coupe ou verre Martini", method:"Verre mélangeur", garnish:"Cerise Marasquin", instructions:"Mélanger au verre mélangeur avec glace. Filtrer dans une coupe froide.", ingredients:[{amount:"50ml",name:"Rye whisky"},{amount:"25ml",name:"Vermouth rouge"},{amount:"2 traits",name:"Angostura bitters"}] },
  "Whisky Sour":          { glass:"Verre Old Fashioned ou coupe", method:"Shaker", garnish:"Cerise et tranche d'orange", instructions:"Dry shake sans glace, puis shaker avec glace. Double filtration.", ingredients:[{amount:"60ml",name:"Bourbon"},{amount:"30ml",name:"Jus de citron frais"},{amount:"20ml",name:"Sucre de canne"},{amount:"1",name:"Blanc d'œuf"},{amount:"2 traits",name:"Angostura bitters"}] },
  "Amaretto Sour":        { glass:"Coupe", method:"Shaker", garnish:"Cerise et zeste d'orange", instructions:"Dry shake puis shaker avec glace. Double filtration dans une coupe.", ingredients:[{amount:"50ml",name:"Amaretto"},{amount:"25ml",name:"Jus de citron frais"},{amount:"15ml",name:"Bourbon"},{amount:"1",name:"Blanc d'œuf"}] },
  "Clover Club":          { glass:"Coupe", method:"Shaker", garnish:"Framboises fraîches", instructions:"Dry shake tous les ingrédients. Ajouter glace et shaker à nouveau. Double filtration.", ingredients:[{amount:"45ml",name:"Gin"},{amount:"15ml",name:"Jus de citron frais"},{amount:"15ml",name:"Sirop de framboise"},{amount:"1",name:"Blanc d'œuf"}] },
  "Tommy's Margarita":    { glass:"Coupe ou verre Margarita", method:"Shaker", garnish:"Rondelle de citron vert", instructions:"Shaker vigoureusement avec de la glace. Filtrer dans le verre.", ingredients:[{amount:"60ml",name:"Tequila reposado"},{amount:"30ml",name:"Jus de citron vert frais"},{amount:"15ml",name:"Sirop d'agave"}] },
  "Paloma":               { glass:"Highball", method:"Direct", garnish:"Sel et rondelle de pamplemousse", instructions:"Givrer le bord. Verser tequila et citron vert sur glace. Compléter avec soda pamplemousse.", ingredients:[{amount:"50ml",name:"Tequila"},{amount:"15ml",name:"Jus de citron vert"},{amount:"120ml",name:"Soda pamplemousse"},{amount:"1 pincée",name:"Sel"}] },
  "Last Word":            { glass:"Coupe", method:"Shaker", garnish:"Cerise Marasquin", instructions:"Shaker toutes les parts égales avec glace. Double filtration dans une coupe froide.", ingredients:[{amount:"25ml",name:"Gin"},{amount:"25ml",name:"Green Chartreuse"},{amount:"25ml",name:"Maraschino"},{amount:"25ml",name:"Jus de citron vert frais"}] },
  "Gimlet":               { glass:"Coupe", method:"Shaker", garnish:"Rondelle de citron vert", instructions:"Shaker avec glace. Double filtration dans une coupe froide.", ingredients:[{amount:"60ml",name:"Gin"},{amount:"20ml",name:"Jus de citron vert frais"},{amount:"15ml",name:"Sucre de canne"}] },
  "French 75":            { glass:"Flûte à Champagne", method:"Shaker", garnish:"Zeste de citron", instructions:"Shaker gin, citron et sucre avec glace. Filtrer dans la flûte. Compléter avec le Champagne.", ingredients:[{amount:"30ml",name:"Gin"},{amount:"15ml",name:"Jus de citron frais"},{amount:"10ml",name:"Sucre de canne"},{amount:"60ml",name:"Champagne"}] },
  "Daiquiri Fraise":      { glass:"Coupe", method:"Shaker", garnish:"Fraise fraîche", instructions:"Muddler les fraises, ajouter les autres ingrédients. Shaker avec glace. Double filtration.", ingredients:[{amount:"50ml",name:"Rhum blanc"},{amount:"25ml",name:"Jus de citron vert"},{amount:"15ml",name:"Sucre de canne"},{amount:"4",name:"Fraises fraîches"}] },
  "Hemingway Daiquiri":   { glass:"Coupe", method:"Shaker", garnish:"Rondelle de pamplemousse", instructions:"Shaker vigoureusement avec glace. Double filtration dans une coupe froide.", ingredients:[{amount:"60ml",name:"Rhum blanc"},{amount:"30ml",name:"Jus de pamplemousse frais"},{amount:"15ml",name:"Jus de citron vert"},{amount:"10ml",name:"Maraschino"}] },
  "Mojito":               { glass:"Highball", method:"Direct", garnish:"Brin de menthe et rondelle de citron vert", instructions:"Muddler doucement la menthe avec le sucre et le citron vert. Ajouter le rhum. Compléter avec eau gazeuse et glace pilée.", ingredients:[{amount:"50ml",name:"Rhum blanc"},{amount:"25ml",name:"Jus de citron vert"},{amount:"15ml",name:"Sucre de canne"},{amount:"8",name:"Feuilles de menthe"},{amount:"75ml",name:"Eau gazeuse"}] },
  "Bee's Knees":          { glass:"Coupe", method:"Shaker", garnish:"Zeste de citron", instructions:"Shaker tous les ingrédients avec glace. Double filtration.", ingredients:[{amount:"60ml",name:"Gin"},{amount:"25ml",name:"Jus de citron frais"},{amount:"20ml",name:"Miel (sirop)"}] },
  "Aviation":             { glass:"Coupe", method:"Shaker", garnish:"Cerise Marasquin", instructions:"Shaker avec glace. Double filtration dans une coupe froide.", ingredients:[{amount:"45ml",name:"Gin"},{amount:"15ml",name:"Maraschino"},{amount:"15ml",name:"Jus de citron frais"},{amount:"5ml",name:"Crème de violette"}] },
  "Bloody Mary":          { glass:"Highball", method:"Direct", garnish:"Branche de céleri, olive, citron", instructions:"Verser tous les ingrédients sur glace. Remuer délicatement. Garnir généreusement.", ingredients:[{amount:"50ml",name:"Vodka"},{amount:"100ml",name:"Jus de tomate"},{amount:"15ml",name:"Jus de citron"},{amount:"3 traits",name:"Sauce Worcester"},{amount:"2 traits",name:"Tabasco"},{amount:"1 pincée",name:"Sel de céleri"}] },
  "Rob Roy":              { glass:"Coupe", method:"Verre mélangeur", garnish:"Cerise Marasquin ou zeste d'orange", instructions:"Mélanger au verre mélangeur avec glace. Filtrer dans une coupe froide.", ingredients:[{amount:"50ml",name:"Scotch"},{amount:"25ml",name:"Vermouth rouge"},{amount:"2 traits",name:"Angostura bitters"}] },
  "Vesper Martini":       { glass:"Coupe ou verre Martini", method:"Shaker", garnish:"Zeste de citron", instructions:"Shaker avec beaucoup de glace jusqu'à très froid. Double filtration dans un verre glacé.", ingredients:[{amount:"45ml",name:"Gin"},{amount:"15ml",name:"Vodka"},{amount:"10ml",name:"Lillet Blanc"}] },
  "Irish Coffee":         { glass:"Verre chaud", method:"Direct", garnish:"Crème fouettée flottante", instructions:"Chauffer le verre. Dissoudre le sucre dans le café chaud. Ajouter le whisky. Faire flotter délicatement la crème sur le dessus.", ingredients:[{amount:"50ml",name:"Irish Whiskey"},{amount:"120ml",name:"Café chaud"},{amount:"10ml",name:"Sucre brun"},{amount:"30ml",name:"Crème fraîche"}] },
  "Pina Colada":          { glass:"Verre ouragan", method:"Blender", garnish:"Ananas et cerise", instructions:"Blender tous les ingrédients avec de la glace pilée jusqu'à consistance crémeuse.", ingredients:[{amount:"50ml",name:"Rhum blanc"},{amount:"50ml",name:"Lait de coco"},{amount:"100ml",name:"Jus d'ananas"}] },
  "White Russian":        { glass:"Verre Old Fashioned", method:"Direct", garnish:"Aucun", instructions:"Verser vodka et Kahlúa sur glace. Ajouter délicatement la crème pour un effet visuel en couche.", ingredients:[{amount:"50ml",name:"Vodka"},{amount:"20ml",name:"Kahlúa"},{amount:"30ml",name:"Crème fraîche"}] },

  "Mezcal Old Fashioned":    { glass:"Verre Old Fashioned", method:"Direct", garnish:"Zeste d'orange fumé", instructions:"Dissoudre l'agave avec les bitters au fond du verre. Ajouter le mezcal et les glaçons. Remuer. Exprimer le zeste d'orange.", ingredients:[{amount:"60ml",name:"Mezcal"},{amount:"5ml",name:"Sirop d'agave"},{amount:"2 traits",name:"Mole bitters"}] },
  "Toronto":                 { glass:"Coupe", method:"Verre mélangeur", garnish:"Zeste d'orange", instructions:"Mélanger au verre mélangeur avec glace. Filtrer dans une coupe froide.", ingredients:[{amount:"55ml",name:"Rye whisky"},{amount:"10ml",name:"Fernet-Branca"},{amount:"5ml",name:"Sucre de canne"},{amount:"1 trait",name:"Angostura bitters"}] },
  "Oaxacan Old Fashioned":   { glass:"Verre Old Fashioned", method:"Direct", garnish:"Zeste d'orange flambé", instructions:"Mélanger tous les ingrédients sur glace. Remuer longuement. Filtrer sur gros glaçon.", ingredients:[{amount:"45ml",name:"Tequila reposado"},{amount:"15ml",name:"Mezcal"},{amount:"5ml",name:"Sirop d'agave"},{amount:"2 traits",name:"Mole bitters"}] },
  "Rum Old Fashioned":       { glass:"Verre Old Fashioned", method:"Direct", garnish:"Zeste d'orange", instructions:"Dissoudre le sucre avec les bitters. Ajouter le rhum et les glaçons. Remuer délicatement.", ingredients:[{amount:"60ml",name:"Rhum noir"},{amount:"5ml",name:"Sucre de canne"},{amount:"2 traits",name:"Angostura bitters"}] },
  "Brandy Old Fashioned":    { glass:"Verre Old Fashioned", method:"Direct", garnish:"Zeste d'orange et cerise", instructions:"Dissoudre le sucre avec les bitters. Ajouter le cognac et la glace. Remuer.", ingredients:[{amount:"60ml",name:"Cognac VSOP"},{amount:"5ml",name:"Sucre de canne"},{amount:"2 traits",name:"Angostura bitters"}] },
  "Revolver":                { glass:"Coupe", method:"Verre mélangeur", garnish:"Zeste d'orange flambé", instructions:"Mélanger au verre mélangeur avec glace. Filtrer dans une coupe froide.", ingredients:[{amount:"60ml",name:"Bourbon"},{amount:"15ml",name:"Kahlúa"},{amount:"2 traits",name:"Orange bitters"}] },
  "Jungle Bird":             { glass:"Verre Old Fashioned", method:"Shaker", garnish:"Ananas et cerise", instructions:"Shaker tous les ingrédients avec glace. Filtrer sur glaçons.", ingredients:[{amount:"45ml",name:"Rhum noir"},{amount:"20ml",name:"Campari"},{amount:"45ml",name:"Jus d'ananas"},{amount:"15ml",name:"Jus de citron vert"},{amount:"15ml",name:"Sucre de canne"}] },
  "Mezcal Negroni":          { glass:"Verre Old Fashioned", method:"Verre mélangeur", garnish:"Zeste d'orange", instructions:"Mélanger au verre mélangeur avec glace. Filtrer sur gros glaçon.", ingredients:[{amount:"30ml",name:"Mezcal"},{amount:"30ml",name:"Campari"},{amount:"30ml",name:"Vermouth rouge"}] },
  "Old Pal":                 { glass:"Coupe", method:"Verre mélangeur", garnish:"Zeste de citron", instructions:"Mélanger au verre mélangeur avec glace. Filtrer dans une coupe froide.", ingredients:[{amount:"30ml",name:"Rye whisky"},{amount:"30ml",name:"Campari"},{amount:"30ml",name:"Vermouth sec"}] },
  "Cardinale":               { glass:"Coupe", method:"Verre mélangeur", garnish:"Zeste de citron", instructions:"Mélanger au verre mélangeur avec glace. Filtrer dans une coupe froide.", ingredients:[{amount:"45ml",name:"Gin"},{amount:"20ml",name:"Campari"},{amount:"20ml",name:"Vermouth sec"}] },
  "Dirty Martini":           { glass:"Coupe ou verre Martini", method:"Shaker", garnish:"Olives", instructions:"Shaker avec beaucoup de glace. Double filtration dans un verre glacé.", ingredients:[{amount:"60ml",name:"Gin ou Vodka"},{amount:"10ml",name:"Vermouth sec"},{amount:"15ml",name:"Saumure d'olive"}] },
  "Bamboo":                  { glass:"Coupe", method:"Verre mélangeur", garnish:"Zeste de citron ou olive", instructions:"Mélanger au verre mélangeur avec glace. Filtrer dans une coupe froide.", ingredients:[{amount:"45ml",name:"Dry Sherry"},{amount:"45ml",name:"Vermouth sec"},{amount:"1 trait",name:"Angostura bitters"},{amount:"1 trait",name:"Orange bitters"}] },
  "Martinez":                { glass:"Coupe", method:"Verre mélangeur", garnish:"Zeste de citron ou cerise", instructions:"Mélanger au verre mélangeur avec glace. Filtrer dans une coupe froide.", ingredients:[{amount:"45ml",name:"Gin Old Tom"},{amount:"25ml",name:"Vermouth rouge"},{amount:"10ml",name:"Maraschino"},{amount:"1 trait",name:"Angostura bitters"}] },
  "Espresso Martini Noisette":{ glass:"Coupe", method:"Shaker", garnish:"Noisette caramélisée", instructions:"Shaker vigoureusement avec de la glace. Double filtration dans une coupe froide.", ingredients:[{amount:"50ml",name:"Vodka"},{amount:"20ml",name:"Frangelico"},{amount:"30ml",name:"Espresso frais"},{amount:"10ml",name:"Sirop de noisette"}] },
  "New York Sour":           { glass:"Verre Old Fashioned", method:"Shaker", garnish:"Flottant de vin rouge", instructions:"Dry shake puis shaker avec glace. Filtrer. Faire flotter délicatement le vin rouge sur le dessus.", ingredients:[{amount:"60ml",name:"Bourbon"},{amount:"30ml",name:"Jus de citron frais"},{amount:"20ml",name:"Sucre de canne"},{amount:"1",name:"Blanc d'œuf"},{amount:"30ml",name:"Vin rouge (flottant)"}] },
  "Tequila Sour":            { glass:"Coupe", method:"Shaker", garnish:"Rondelle de citron vert", instructions:"Dry shake sans glace puis shaker avec glace. Double filtration.", ingredients:[{amount:"60ml",name:"Tequila blanco"},{amount:"30ml",name:"Jus de citron vert frais"},{amount:"20ml",name:"Sucre de canne"},{amount:"1",name:"Blanc d'œuf"}] },
  "Spicy Margarita":         { glass:"Coupe", method:"Shaker", garnish:"Rondelle de jalapeño et sel pimenté", instructions:"Muddler le jalapeño. Shaker tous les ingrédients avec glace. Double filtration.", ingredients:[{amount:"50ml",name:"Tequila blanco"},{amount:"25ml",name:"Triple Sec"},{amount:"25ml",name:"Jus de citron vert"},{amount:"2 rondelles",name:"Jalapeño frais"}] },
  "Mezcal Margarita":        { glass:"Coupe", method:"Shaker", garnish:"Sel fumé sur le bord", instructions:"Givrer le bord de sel fumé. Shaker avec glace. Double filtration.", ingredients:[{amount:"50ml",name:"Mezcal"},{amount:"25ml",name:"Triple Sec"},{amount:"25ml",name:"Jus de citron vert"}] },
  "Watermelon Margarita":    { glass:"Coupe", method:"Shaker", garnish:"Triangle de pastèque", instructions:"Shaker tous les ingrédients avec glace. Double filtration.", ingredients:[{amount:"50ml",name:"Tequila blanco"},{amount:"25ml",name:"Triple Sec"},{amount:"60ml",name:"Jus de pastèque frais"},{amount:"15ml",name:"Jus de citron vert"}] },
  "Gin Tonic Floral":        { glass:"Ballon", method:"Direct", garnish:"Fleurs comestibles et concombre", instructions:"Remplir de glaçons. Verser le gin floral. Compléter avec le tonic elderflower. Garnir avec concombre et fleurs.", ingredients:[{amount:"50ml",name:"Gin floral"},{amount:"150ml",name:"Tonic elderflower"},{amount:"2 tranches",name:"Concombre"}] },
  "Gin Tonic Agrume":        { glass:"Ballon", method:"Direct", garnish:"Zeste de pamplemousse", instructions:"Remplir de glaçons. Verser le gin. Compléter avec tonic citrus. Garnir d'un zeste de pamplemousse.", ingredients:[{amount:"50ml",name:"Gin London Dry"},{amount:"150ml",name:"Tonic citrus"},{amount:"1",name:"Zeste de pamplemousse"}] },
  "Gin Tonic Épicé":         { glass:"Ballon ou Highball", method:"Direct", garnish:"Rondelle de piment et citron vert", instructions:"Remplir de glaçons. Verser le gin. Ajouter le gingembre. Compléter avec le tonic.", ingredients:[{amount:"50ml",name:"Gin London Dry"},{amount:"150ml",name:"Tonic water"},{amount:"2 rondelles",name:"Gingembre frais"},{amount:"1 rondelle",name:"Piment rouge"}] },
  "Gin Tonic Rose":          { glass:"Ballon", method:"Direct", garnish:"Pétales de rose et framboises", instructions:"Remplir de glaçons. Verser le gin. Ajouter le sirop. Compléter avec le tonic rosé. Garnir.", ingredients:[{amount:"50ml",name:"Gin floral"},{amount:"10ml",name:"Sirop de framboise"},{amount:"150ml",name:"Tonic rosé"}] },
  "French Martini":          { glass:"Coupe", method:"Shaker", garnish:"Framboises fraîches", instructions:"Shaker vigoureusement avec glace pour créer une mousse. Double filtration dans une coupe froide.", ingredients:[{amount:"50ml",name:"Vodka"},{amount:"15ml",name:"Chambord"},{amount:"30ml",name:"Jus d'ananas frais"}] },
  "Kamikaze":                { glass:"Coupe", method:"Shaker", garnish:"Rondelle de citron vert", instructions:"Shaker tous les ingrédients avec glace. Double filtration dans une coupe froide.", ingredients:[{amount:"40ml",name:"Vodka"},{amount:"20ml",name:"Triple Sec"},{amount:"20ml",name:"Jus de citron vert"}] },
  "Lemon Drop":              { glass:"Coupe avec sucre sur le bord", method:"Shaker", garnish:"Zeste de citron", instructions:"Givrer le bord avec du sucre. Shaker avec glace. Double filtration.", ingredients:[{amount:"50ml",name:"Vodka citron"},{amount:"20ml",name:"Triple Sec"},{amount:"25ml",name:"Jus de citron frais"},{amount:"10ml",name:"Sucre de canne"}] },
  "Passionfruit Daiquiri":   { glass:"Coupe", method:"Shaker", garnish:"Demi fruit de la passion", instructions:"Shaker tous les ingrédients vigoureusement avec de la glace. Double filtration dans une coupe froide.", ingredients:[{amount:"50ml",name:"Rhum blanc"},{amount:"20ml",name:"Passoa"},{amount:"25ml",name:"Jus de citron vert"},{amount:"15ml",name:"Sucre de canne"}] },
  "Lychee Martini":          { glass:"Coupe", method:"Shaker", garnish:"Lychee frais", instructions:"Shaker tous les ingrédients avec glace. Double filtration dans une coupe froide.", ingredients:[{amount:"50ml",name:"Vodka"},{amount:"20ml",name:"Liqueur de lychee"},{amount:"20ml",name:"Jus de citron vert"},{amount:"10ml",name:"Sucre de canne"}] },
  "South Side":              { glass:"Coupe", method:"Shaker", garnish:"Brin de menthe", instructions:"Muddler doucement la menthe. Shaker avec glace. Double filtration dans une coupe froide.", ingredients:[{amount:"60ml",name:"Gin"},{amount:"25ml",name:"Jus de citron frais"},{amount:"15ml",name:"Sucre de canne"},{amount:"6",name:"Feuilles de menthe"}] },
  "Ramos Gin Fizz":          { glass:"Highball", method:"Shaker (5 min)", garnish:"Aucun", instructions:"Dry shake 5 min sans glace. Ajouter glace, shaker 2 min. Filtrer dans le verre. Compléter avec eau gazeuse froide.", ingredients:[{amount:"50ml",name:"Gin"},{amount:"25ml",name:"Jus de citron frais"},{amount:"15ml",name:"Jus de lime"},{amount:"20ml",name:"Sucre de canne"},{amount:"30ml",name:"Crème fraîche"},{amount:"1",name:"Blanc d'œuf"},{amount:"3 traits",name:"Eau de fleur d'oranger"},{amount:"60ml",name:"Eau gazeuse"}] },
  "Red Snapper":             { glass:"Highball", method:"Direct", garnish:"Branche de céleri et citron", instructions:"Verser tous les ingrédients sur glace. Remuer. Garnir.", ingredients:[{amount:"50ml",name:"Gin"},{amount:"100ml",name:"Jus de tomate"},{amount:"15ml",name:"Jus de citron"},{amount:"2 traits",name:"Sauce Worcester"},{amount:"1 trait",name:"Tabasco"}] },
  "Bloody Caesar":           { glass:"Highball", method:"Direct", garnish:"Branche de céleri, citron, olive", instructions:"Givrer le bord de sel épicé. Verser tous les ingrédients sur glace. Remuer.", ingredients:[{amount:"50ml",name:"Vodka"},{amount:"120ml",name:"Clamato"},{amount:"15ml",name:"Jus de citron"},{amount:"3 traits",name:"Sauce Worcester"},{amount:"2 traits",name:"Tabasco"},{amount:"1 pincée",name:"Sel de céleri"}] },
  "Brooklyn":                { glass:"Coupe", method:"Verre mélangeur", garnish:"Cerise Marasquin", instructions:"Mélanger au verre mélangeur avec glace. Filtrer dans une coupe froide.", ingredients:[{amount:"50ml",name:"Rye whisky"},{amount:"20ml",name:"Vermouth sec"},{amount:"10ml",name:"Maraschino"},{amount:"5ml",name:"Amer Picon"}] },
  "Red Hook":                { glass:"Coupe", method:"Verre mélangeur", garnish:"Cerise Marasquin", instructions:"Mélanger au verre mélangeur avec glace. Filtrer dans une coupe froide.", ingredients:[{amount:"60ml",name:"Rye whisky"},{amount:"15ml",name:"Vermouth rouge"},{amount:"15ml",name:"Maraschino"}] },
  "El Presidente":           { glass:"Coupe", method:"Verre mélangeur", garnish:"Zeste d'orange", instructions:"Mélanger au verre mélangeur avec glace. Filtrer dans une coupe froide.", ingredients:[{amount:"60ml",name:"Rhum blanc"},{amount:"20ml",name:"Vermouth blanc"},{amount:"10ml",name:"Triple Sec"},{amount:"5ml",name:"Grenadine"}] },
  "Airmail":              { glass:"Flûte", method:"Shaker", garnish:"Brin de menthe", instructions:"Shaker rhum, citron vert, miel et jus d'orange avec glace. Filtrer dans la flûte. Compléter avec Champagne.", ingredients:[{amount:"45ml",name:"Rhum ambré"},{amount:"20ml",name:"Jus de citron vert"},{amount:"15ml",name:"Miel (sirop)"},{amount:"60ml",name:"Champagne"}] },
};

// ── Substitution groups ────────────────────────────────────────────────────
const SUBSTITUTIONS = [
  ["Bourbon","Rye Whisky","Scotch Blended","Irish Whiskey"],
  ["Rhum blanc","Rhum ambré","Rhum noir","Cachaça"],
  ["Triple Sec","Cointreau","Grand Marnier"],
  ["Tequila Blanco","Tequila Reposado","Mezcal"],
  ["Cognac VSOP","Armagnac","Calvados"],
  ["Prosecco","Champagne","Crémant"],
  ["Sucre de canne","Sirop d'agave","Miel (sirop)"],
  ["Vermouth Rouge","Vermouth Sec","Vermouth Blanc"],
  ["Gin London Dry","Gin Old Tom","Gin Floral"],
  ["Crème fraîche","Lait de coco"],
];

const CLASSIQUE_TAGS = {
  "Old Fashioned":    ["whisky","spirit-forward","amer","sucré"],
  "Negroni":          ["gin","amer","campari","vermouth","spirit-forward"],
  "Martini":          ["gin","sec","vermouth","spirit-forward","élégant"],
  "Espresso Martini": ["vodka","café","crémeux","sucré"],
  "Pisco Sour":       ["pisco","sour","citrus","mousseux","équilibré"],
  "Margarita":        ["tequila","citrus","acide","frais","sel"],
  "Gin Tonic":        ["gin","tonic","pétillant","amer","frais"],
  "Cosmopolitan":     ["vodka","citrus","fruité","frais","élégant"],
  "Pornstar Martini": ["vodka","tropical","fruité","sucré","pétillant"],
  "Gin Fizz":         ["gin","citrus","pétillant","frais","long"],
  "Tomatini":         ["vodka","tomate","épicé","umami","salé"],
  "Vieux Carré":      ["whisky","cognac","vermouth","amer","complexe","spirit-forward"],
  "Daiquiri":         ["rhum","citrus","frais","simple","acide"],
};

// ── Cocktail Tags Cache ───────────────────────────────────────────────────
const TAGS_CACHE = {};

async function fetchCocktailTags(name, ingredients) {
  if (TAGS_CACHE[name] && TAGS_CACHE[name].length > 0) return TAGS_CACHE[name];
  try {
    const ingredientList = (ingredients||[]).length
      ? `Ingredients: ${(ingredients||[]).map(i => i.name || i).join(", ")}.`
      : "";
    const response = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 150,
        system: "You are a cocktail flavor expert. Return ONLY a valid JSON array of 3 or 4 strings, nothing else. No markdown, no explanation.",
        messages: [{ role: "user", content: `Pick 3-4 flavor tags from: ${FLAVOR_TAGS.join(", ")}. Cocktail: ${name}. ${ingredientList} Return only a JSON array like: ["tag1","tag2","tag3"]` }],
      }),
    });
    const data = await response.json();
    if (data.error) { console.error("Tags API error:", data.error); return []; }
    const text = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("").trim();
    const clean = text.replace(/```json|```/g,"").trim();
    const start = clean.indexOf("[");
    const end = clean.lastIndexOf("]");
    if (start === -1 || end === -1) return [];
    const parsed = JSON.parse(clean.slice(start, end+1));
    const tags = parsed.filter(t => FLAVOR_TAGS.includes(t)).slice(0,4);
    TAGS_CACHE[name] = tags;
    return tags;
  } catch(e) { console.error("Tags error:", e); return []; }
}

// ── Helper functions ───────────────────────────────────────────────────────
function diffordsUrl(name) {
  return `https://www.diffordsguide.com/cocktails/recipe/${name.toLowerCase().replace(/[àâä]/g,"a").replace(/[éèêë]/g,"e").replace(/[îï]/g,"i").replace(/[ôö]/g,"o").replace(/[ùûü]/g,"u").replace(/[ç]/g,"c").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}`;
}

function getRecipe(name, customCocktails=[]) {
  const custom = customCocktails.find(c => c.name === name);
  if (custom) return custom.recipe || null;
  return RECIPES[name] || null;
}


const DIFFORD_HALL_OF_FAME = [
  "Absinthe Drip","Acapulco","Adonis","Alabama Slammer","Alaska","Alexander","Amaretto Sour","Americano",
  "Angel Face","Aperol Spritz","Apple Martini","Aviation","B-52 Shot","Bamboo","Banana Daiquiri","Bee's Knees",
  "Bijou","Black Russian","Blackthorn","Blood and Sand","Bloody Mary","Blue Blazer","Bobby Burns","Boston Sour",
  "Boulevardier","Bradford Martini","Brandy Alexander","Brandy Crusta","Bronx","Brooklyn","Buck's Fizz","Bullshot",
  "Caipirinha","Cameron's Kick","Champagne Cocktail","Charlie Chaplin","Chartreuse Swizzle","Clover Club","Cobbler","Collins",
  "Colorado Bulldog","Cosmopolitan","Cuba Libre","Cucumber Gimlet","Daiquiri","Daiquiri No.1","Daiquiri on-the-rocks","Dark 'n' Stormy",
  "Dawa","Death in the Afternoon","Depth Charge","Dirty Martini","Dry Martini","Earl Grey MarTEAni","El Presidente","Espresso Martini",
  "Fancy Free","Fifty-Fifty Martini","Fitzgerald","Floradora","Fog Cutter","Franklin's 15:1 Martini","French 75","Frozen Daiquiri",
  "Gimlet","Gin & Tonic","Gin Alexander","Gin Fizz","Gin Rickey","Gin Sour","Godfather","Godmother",
  "Gold Rush","Grasshopper","Green Eyes","Harvey Wallbanger","Hemingway Daiquiri","Honeysuckle","Horse's Neck","Hot Toddy",
  "Hotel Nacional","Hummingbird","Hurricane","Jack Rose","Japanese Slipper","John Collins","Jungle Bird","Kir Royale",
  "Last Word","Lemon Drop","Long Island Iced Tea","Luigi","Mai Tai","Manhattan","Margarita","Martinez",
  "Mary Pickford","Mimosa","Mint Julep","Mojito","Monte Carlo","Moscow Mule","Naked and Famous","Negroni",
  "Sbagliato","New York Sour","Oaxacan Old Fashioned","Old Cuban","Old Fashioned","Old Pal","Painkiller","Paloma",
  "Paper Plane","Penicillin","Perfect Manhattan","Pina Colada","Pink Gin","Pink Lady","Pisco Sour","Planters Punch",
  "Pornstar Martini","Port Charlotte","Prescription Julep","Ramos Gin Fizz","Raspberry Martini","Rattlesnake","Rob Roy","Rose",
  "Rusty Nail","Sazerac","Screwdriver","Sea Breeze","Sex on the Beach","Sidecar","Singapore Sling","Sloe Gin Fizz",
  "Southside","Southside Fizz","Southside Rickey","Spritz","Stinger","Suffering Bastard","Tequila Sunrise","Tom Collins",
  "Tommy's Margarita","Tuxedo","Ultima Palabra","Vieux Carré","Vodka Collins","Vodka Martini","Ward Eight","Whiskey Sour",
  "White Lady","White Russian","Woo Woo","Yellow Fever","Zombie","South Side Rickey","Mezcal Margarita","Anejo Manhattan",
  "Benton's Old Fashioned","Daisy Buchanan","Gin Blossom Martini","Smoky Cokey","Gin Basil Smash","Sunflower","Bramble","Picante de la Casa",
  "Division Bell","Breakfast Martini","White Negroni","Flannel Shirt","Tomatini","Kingston Negroni","Trinidad Sour","Black Manhattan",
  "Greenpoint","Red Hook","Toronto","Mezcal Negroni","Screaming Orgasm","Caipiroska","French Martini","Bellini",
  "Blood Orange Garibaldi","Corpse Reviver No.2","Dead Man's Handle","Death Star","El Diablo","Gibson","Godfather Sour","Italian Margarita",
  "Knickerbocker","Lion's Tail","London Calling","Milk Punch","Night in Tunisia","Obituary Martini","Perfect Negroni","Pink Daiquiri",
  "Poet's Dream","Preakness","Regent's Punch","Remember the Maine","Ron Collins","Royal Bermuda Yacht Club","Rum Alexander","Rum Old Fashioned",
  "Satan's Whiskers","Sherry Cobbler","Sloe Gin Negroni","Sweet Manhattan","Tamarind Margarita","Tequila Old Fashioned","Tropical Itch","Velocipede",
  "Warday's","Whisky Mac","Wild Turkey Sour","Yellow Parrot","Boston Deluxe","Saffron Royale","Bermondsey Minute","Mezcal Dante",
  "Dublin Minstrel","Iron Negroni","Last Palabra","Pinky Negroni","Alpine Negroni","Damn It Jimmy","Madurised Old Fashioned","Pippin No.2",
  "Brooklyn (perfect)","Warday's Cocktail","20th Century Cocktail","Old Friend","Psychopathia Sexualis","Dark n Stormy","Planter's Punch","Three Dots and a Dash",
  "Ti Punch","Dark and Stormy","Campari Spritz","Cardinale","Jasmine","Killer Cocktail","Milano Torino","Milanese G&T",
  "Old Gal","The Ribbon","Sloegroni","Highland Sling","Añejo Manhattan","Batanga","Brave Bull","Mexican Mule",
  "Ranch Water","Vampiro","Silk Road","Final Ward","Monkey's Paw","Wordsmith","Chartreuse Daisy","Champs-Elysees",
  "Chartreuse Sour","Sicilian Kiss","Toasted Almond","French Connection","Amaretto Stone Sour","Disaronno Fizz","Frisco Sour","Honeymoon",
  "First Word","Latest Word","Loose Talk","Bees Knees","Hotel Georgia","Hudson Mule","Maple Sour","Mississippi Punch",
  "Oaxacan Negroni","Porn Star Martini","Presidente","Ritz Sidecar","Rum Cobbler","Rum Shrub","Savoy Corpse Reviver","Smoking Gun",
  "Swizzle","The Last Word","Tulip","Turbo Shandy","Turtle Dove","Valencia","Venus in Furs","Vieux Carre",
  "Marsala Martini","Banana Calling","Clover Club (House-Made)","Celery Century","Grand White Lady","Sabot","Wibble","English Marmalade",
  "Sicilian Negroni","Affinity","Barbary Coast","Scotch Sour","Velvet Old Fashioned","R U Bobby Moore?","Coco Geisha","Dantes in Fernet",
  "Hemingway Special (Papa Doble)","Maple Rum Old Fashioned","Curtain Call","Royal Mojito","Russian Spring Punch","Winter Solace","For Sake's Sake","Wardroom",
  "Brandy Manhattan","Brandy Old Fashioned (Wisconsin-style)","Burnt Fuselage","Ce Soir (This Evening)","Celebration","French 125","Champagne Snowball","Fleur de Paradis",
  "Pisco Punch (Difford's Recipe)","Bicicletta Spritz","Negroni Tredici","Sorrentino","Spritz Veneziano","Ernest + Rita","Dried Meadow Flower","In-Seine",
  "Esmeralda","Irish Maid","Pyramid Punch","Ruby","Buttercup","Sheroni","Smokestack Lightning","S 'n' Emm",
  "Blackthorn No. 5","Blackthorn (English)","Christmas Negroni","Green Deacon","San Francisco (Café Royal)","Slow Screw","Slow Comfortable Mexican Screw Against The Wall","Brown Derby",
  "Enrico Palazzo","Haberdasher","Haystack Cocktail","Hi Falutin","Kentucky Buck","Whiskey Smash","Bernice","Bucket",
  "Courtside","Geisha Martini","Greyhounds Tooth","One Sip Martini","Pernelle","Polish Martini","Sunset Vibes","Vesper Dry Martini",
  "Azalea Margarita","Cadáver Reviver","Dama Blanca","The Dante","New York Minute","Sandy The Showgirl","Margarita on-the-rocks (Difford's)","Corpse Reviver No.4",
  "Fire & Brimstone","Florence Cocktail","Jeez Louise","Mezcalero","Passion Fruit Margarita","1910","King's Jubilee","Dublin Spider Highball",
  "Hearn Cocktail","High King","Holy Joe Cocktail","Irish Cocktail","Irish Coffee","Irish Old Fashioned","Lone Oak","Parle-vous Irish",
  "Difford's Fruit Cup No.1","The StiG","Sugar My Plums","There It Is...","Bucket List","Absinthe Spider Highball","Absinthe by Jimmy","Absinthe Cocktail",
  "Absinthe Frappé","Absinthe Martini","Absinthe Mojito","Absinthe Sour","Bohemian Mule","De La Louisiane","Duchess","Fairy Cream",
  "Green Swizzle","Waldorf Cocktail No.1","Ambrosia Cocktail","Angel's Advocate","Añogo","Beach Blonde","Bessie & Jessie","Canary Flip",
  "Casablanca No.2","Christmas Pudding & Custard Cocktail","Christmas Velvet Alexander","Creme Egg Cocktail","Crème Anglaise Cocktail","Dutch Breakfast Cocktail","Dutch Courage","Orange Custard Cocktail",
  "Rhubarb & Custard Cocktail","Snowball","Whisky Butter","Amaretto Manhattan","Amaretto Tequila Old Fashioned","Adelaide","A Dream to Be","Casa Savoia Boulevardier",
  "Casa Savoia Garibaldi","Casa Savoia Spritz","Garibaldino","L'Americano","L'Americano Moderno","Less is More Negroni","Mission Bell","Murano Negroni",
  "Sips Sgroppino","Tirreno","VerMillion Fizz","Vivi","A Moment of Silence","Manhattan Island","Pink Gin & Tonic","Port of Spain Cocktail",
  "Queen's Park Hotel Super Cocktail","Queen's Park Swizzle","Sawyer","Tiki Max","Cannonball","Claridge Cocktail","Colonel Ward","Dulchin",
  "Ernst Happel","Fairbanks No.1","Hotel Nacional Special","New York Stone Sour","Playmate Martini","Praecocia Cocktail","Ruby Manhattan","Sunny Disposition",
  "Brass Rail","Chrysanthemum","De La Louisiane No.4","La Poire des Benedictines","London Gypsy","Monte Cassino","The Addington","Tip Top",
  "Vancouver","Widow's Kiss","Adios Motherfucker","Bikini Martini","Black Widow's Bite","China Blue Cocktail","Corpse Reviver No. Blue","Crystal Ship",
  "Darlington","Electric Lemonade","Palm Royale Grasshopper","Rollergirl","Sharman-Cox Daiquiri","Sidecar No. Blue","Vacation Martini","Apple Blossom Cocktail",
  "Feather Duster Crusta","Forbidden Fruit","Harvest Cocktail","Jack Collins","Widows Kiss","Humble Pie","Bitter in Brazil","Brazil 66",
  "Brazil Basil Smash","Brazilian Contessa","Brazuca Remedy","Cachaça Fruit Cup","Caneflower","Edison's Medicine","Iz Bananaz","Lavarello",
  "Lemon Beat","Macunaíma","Orinoco","Pineapple & Mint Caipirinha","Rabo-de-Galo","Sweet Grape Caipirinha","Carlton Banks","Chanbanger Cocktail",
  "Cherry Springer","Copenhagen Cocktail","Eclipse Cocktail","Fog Cutter (Bramble-style)","Fumigator Flip","Hunter Cocktail","The Broady","Vanessa Polk",
  "Velasco & Sand","Xanthia","Triumph of Aniseed","Vanilla Espresso Martini","Ampersand Cocktail","Brandy Flip","East India No.1","Gennaro's Sidecar",
  "Landing Gear","Preakness Manhattan","Don Pone","East India No.2","Creole Cosmo","Eclipse","Ginger Cosmo","Grand Cosmopolitan",
  "Honey Cosmopolitan","Maria Theresa Margarita","Mexico City","Minty Pentones","Pan Galactic Gargle Blaster","Rosarita Margarita","Rude Cosmopolitan","Yule Luv It",
  "100-year-old-cigar","Easy Speak","Five Keys","Game Set Match","Little Italy","Sin Cyn cocktail","Biggles Aviation","Biggles Sidecar",
  "Byculla","Four Aces","German Vacation","Ginger Martini","Gingerbread Old Fashioned","Pot of Gold","Roman Highball","Smoke & Mirrors (mezcal-based)",
  "Winter","Avenue San Martin","Barbacoa","Cablegram","Chinese Whisper","Clan MacLeod","Concrete Slippers","Golden Spritz",
  "Honey Badger","Medicina Latina","The Continental Exchange","The Saint","When The Smoke Cleared","Aventura","Larchmont","Palo Negro",
  "Peat's Dragon","Red Lion","Yellow Daisy","Bergamot & Coconut Cobbler","Bergamot Bamboo","Clandestine","Coffee & Tonic","Crystal Clear",
  "Fantasticus","Favola","Garibaldicus","IPAlicus","Italicup","L'Arte Della Bellezza","Negroni Bianco Bergamotto","Spritzer Fresco",
  "Stonage","The Queen's Steeple","Bon Bon","Italian Sun","Lemon Meringue Pie'tini","Lemon Sherbet Margarita","Lemony","Motox",
  "Navigator","Procrastination Cocktail","Red Earl","Renaissance","Salvatore Meets","Sanguinello Cocktail","Spiked Arnold Palmer","Tratto Limoncello Cocktail",
  "Yellow Belly","Yellow Negroni","Dragon Punch","Mezcal Stone Sour","Mezcal Fruit Cup","Pastry War Margarita","Port of Spain (by Dominic Alling)","Spicy Smoky Margarita",
  "Tommy's Mezcal Margarita","Adriatique Cocktail","Bubo Bubo","Burning Bright","Circus Circus","Hunter's Verdict","Lost Plane","M & M",
  "The Malagueña","Monte Paloma","MonteNegroni","Monterita","Touchwood","Caribbean Sazerac","Coconut Rum Punch","In the August Sun",
  "Kamaniwanalaya","Nuclear Banana Daiquiri","Nuclear Daiquiri","Passion Fruit Rum Punch","Rum Punch","Rumshack Punch","Shark's Tooth No.1 (Trader Vic's)","Waters of Chaos",
  "Aku Aku","Bellini Peach Spritz","Bellini-Tini","Fruity Sex on the Beach","Georgia Mint Julep","Jelly Belly Beany","Missionary's Downfall","Peach & Apricot Spritz",
  "Peach Me","Peach Old-fashioned (Wisconsin-style)","Peach Tea","Batida Rosa","Champagne Piña Colada","Club Cocktail (my recipe)","French Daiquiri","Kingston Club",
  "Pisco Punch","Club Cocktail (Difford's recipe)","Double Grape","Mosquito","Paddington Bear Martini","Peruvian Elder Sour","Pinecone","Pini",
  "Pisco Collins","Pisco Kid","Pisco Punch (Micheli's recipe)","Pisco Punch (Prosser's recipe)","Pisco Sour (my recipe)","Death in Venice","Fruit Cup Spritz","Hugo",
  "Jamie's Mojito","La Cola Nostra","La Dolce Vita","Le Commercant (The Merchant)","Limoncello Spritz","Milanese Breakfast Martini","Mrs Daisy Robinson","The Moment",
  "Bakewell Tart Sour","Absinthe Drip Cocktail","Aged Honey Daiquiri","Canchànchara","Honey Cobbler","Honeysuckle Daiquiri","Pooh'tini","Queen's Knees",
  "The Savelberg","Warsaw Cooler","Zoom","Apple Jack Rabbit (Savoy)","Cowboy Derby","Mountain Man Cocktail","Mule's Hind Leg","Old Vermont",
  "Cucumber Sake-Tini","Japanese Pear","Original Sin","Sake Manhattan","Sake Martini","Saketini","Sakini","Summa Peto",
  "Sumo In A Sidecar","Voyager Vodka Martini","Alexander The Great","Aged Grappa Espresso Martini","Ciao Bella","Moo'lata","Naughty Charles","Orinoco Cocktail",
  "Psycho Killer Cocktail","Ramos Chocolate Fizz","Silk Stocking Cocktail","Waldorf Daiquiri","American Beauty (by David Embury)","The Angel Wore Red","The Astor","Fresh White Lady",
  "Ice in the Hat","Mai Tai (Difford's recipe)","Mint Cocktail","Prince Henry","Vodka Stinger","Affogato Cocktail","Chocolate Orange Espresso Martini","Lotus Espresso",
  "Midnight Over Tennessee","Mr Bali Hai","Pura Vida","Tiramisu","Black Jack","Dairy Milk Chocolate","Fruit Salad","Gingerbread",
  "Jaffa Cake (Jaffa Martini)","Love Heart","Marshmallow (Marshmallow 'Martini')","Parma Violet (Parma Violet Spritz)","Smarties (Smartini)","Strega Chocolate (Accoutrement)","Toblerone","Tootie Fruity (Tootie Fruity Lifesaver)",
  "Tootsie Roll","Turkish Delight (Persepolis)","Almond Atholl Brose","Banana Daiquiri (shaken)","Banana Split","Bird of Paradise","Dirty Banana","Grasshopper No. 2",
  "Gustings' Grasshopper","Orange Brulée","Parisian Blond","Sgroppino Sorbetto","Tequila Alexander","Tiramisu Cocktail","Aperitivo Spritz","Gin Fruit Cup",
  "Singapore Sling (Dale DeGroff's recipe)","Aviation Cocktail (Difford's recipe)","Daisy Cutter Martini","Fall Into Spring Negroni","Floral Daiquiri","Garden Sour","The Mayflower Martini","Parisian Spring Punch",
  "Sakura Martini","Spring Feeling","Spring Fresh Spritz","Spring Green","Wild Blossom","Zuzus Petals","Blinker (Hawksmoor's Riff)","Made Man",
  "Celery Gimlet No.2","Detroit Athletic Club","Alaska (Straub's 1914 recipe)","Angel's Draft","Brasil","Colleen Bawn","Corpse Reviver No.2 (Contemporary Recipe)","Death Flip",
  "Diamondback","Bahama Mama","Airmail","Daisy de Santiago","Ti' Punch","Columbia Skin","Maple Old Fashioned","Dirty Vodka Martini",
  "Gin Tonic Classique","Sazerac Cocktail (Difford's recipe)","Kamikaze","Californian Margarita","Closing Argument","Comte de Sureau","Enzoni","Fluffy Duck",
  "Ford Cocktail","Left Bank Martini","Michelada","Midnight Stinger","Mizuwari","Presbyterian","Reggae Rum Punch","Right Hand",
  "Shaft","Spicy Margarita","Cosmonaut","Hunter-cocktail","Rum Swizzle","Pineapple Martini","Absolute Gangster","Bensonhurst",
  "Black Negroni","The Business","Elderflower Collins","Fat Cat","Honey Sour","Jägerita","Left Hand","Passion Fruit Martini",
  "Port of Spain","Rapscallion","Rhubarb & Custard","Salty Dog","Sherry Negroni","South Side","Tequila Martini","Winchester",
];


// Maps cocktail names to their primary spirit family
const COCKTAIL_FAMILY_MAP = {
  // Absinthe
  "Absinthe Cocktail":"Absinthe",
  "Absinthe Drip":"Absinthe",
  "Absinthe Drip Cocktail":"Absinthe",
  "Absinthe Frappé":"Absinthe",
  "Absinthe Mojito":"Absinthe",
  "Absinthe Sour":"Absinthe",
  "Absinthe Spider Highball":"Absinthe",
  "Absinthe by Jimmy":"Absinthe",
  "Black Jack":"Absinthe",
  "Bohemian Mule":"Absinthe",
  "Death in the Afternoon":"Absinthe",
  "Duchess":"Absinthe",
  "Fairy Cream":"Absinthe",
  "Original Sin":"Absinthe",
  "Triumph of Aniseed":"Absinthe",
  // Amaretto
  "Amaretto Sour":"Amaretto",
  "Amaretto Stone Sour":"Amaretto",
  "Disaronno Fizz":"Amaretto",
  "Godfather Sour":"Amaretto",
  "Sicilian Kiss":"Amaretto",
  "Toasted Almond":"Amaretto",
  // Campari
  "Adelaide":"Campari",
  "Americano":"Campari",
  "Bicicletta Spritz":"Campari",
  "Blood Orange Garibaldi":"Campari",
  "Campari Spritz":"Campari",
  "Casa Savoia Garibaldi":"Campari",
  "Death in Venice":"Campari",
  "English Marmalade":"Campari",
  "Garibaldino":"Campari",
  "Jungle Bird":"Campari",
  "Killer Cocktail":"Campari",
  "L'Americano":"Campari",
  "L'Americano Moderno":"Campari",
  "Milano Torino":"Campari",
  "Negroni Tredici":"Campari",
  "Old Gal":"Campari",
  "Sanguinello Cocktail":"Campari",
  "Sicilian Negroni":"Campari",
  "Sorrentino":"Campari",
  "The Angel Wore Red":"Campari",
  "The Ribbon":"Campari",
  "Vivi":"Campari",
  // Champagne
  "Bellini":"Champagne",
  "Bellini Peach Spritz":"Champagne",
  "Buck's Fizz":"Champagne",
  "Champagne Piña Colada":"Champagne",
  "Champagne Snowball":"Champagne",
  "Fleur de Paradis":"Champagne",
  "Kir Royale":"Champagne",
  "Mimosa":"Champagne",
  "Peach & Apricot Spritz":"Champagne",
  // Chartreuse
  "Chartreuse Daisy":"Chartreuse",
  "Chartreuse Sour":"Chartreuse",
  "Chartreuse Swizzle":"Chartreuse",
  "Yellow Parrot":"Chartreuse",
  // Cognac / Calvados
  "Affogato Cocktail":"Cognac / Calvados",
  "Aged Grappa Espresso Martini":"Cognac / Calvados",
  "Alexander":"Cognac / Calvados",
  "Ambrosia Cocktail":"Cognac / Calvados",
  "American Beauty (by David Embury)":"Cognac / Calvados",
  "Ampersand Cocktail":"Cognac / Calvados",
  "Apple Blossom Cocktail":"Cognac / Calvados",
  "Apple Jack Rabbit (Savoy)":"Cognac / Calvados",
  "Banana Split":"Cognac / Calvados",
  "Between the Sheets":"Cognac / Calvados",
  "Biggles Sidecar":"Cognac / Calvados",
  "Brandy Alexander":"Cognac / Calvados",
  "Brandy Crusta":"Cognac / Calvados",
  "Brandy Flip":"Cognac / Calvados",
  "Brandy Manhattan":"Cognac / Calvados",
  "Brandy Old Fashioned (Wisconsin-style)":"Cognac / Calvados",
  "Burnt Fuselage":"Cognac / Calvados",
  "Carlton Banks":"Cognac / Calvados",
  "Ce Soir (This Evening)":"Cognac / Calvados",
  "Celebration":"Cognac / Calvados",
  "Champagne Cocktail":"Cognac / Calvados",
  "Champs-Elysees":"Cognac / Calvados",
  "Christmas Pudding & Custard Cocktail":"Cognac / Calvados",
  "Concrete Slippers":"Cognac / Calvados",
  "Dead Man's Handle":"Cognac / Calvados",
  "Depth Charge":"Cognac / Calvados",
  "Don Pone":"Cognac / Calvados",
  "East India No.1":"Cognac / Calvados",
  "East India No.2":"Cognac / Calvados",
  "Feather Duster Crusta":"Cognac / Calvados",
  "Fish House Punch":"Cognac / Calvados",
  "Florence Cocktail":"Cognac / Calvados",
  "Forbidden Fruit":"Cognac / Calvados",
  "French 125":"Cognac / Calvados",
  "French Connection":"Cognac / Calvados",
  "Gennaro's Sidecar":"Cognac / Calvados",
  "Gustings' Grasshopper":"Cognac / Calvados",
  "Harvest Cocktail":"Cognac / Calvados",
  "Honeymoon":"Cognac / Calvados",
  "Humble Pie":"Cognac / Calvados",
  "In-Seine":"Cognac / Calvados",
  "Jack Collins":"Cognac / Calvados",
  "Jack Rose":"Cognac / Calvados",
  "La Poire des Benedictines":"Cognac / Calvados",
  "Landing Gear":"Cognac / Calvados",
  "Le Commercant (The Merchant)":"Cognac / Calvados",
  "Manhattan Island":"Cognac / Calvados",
  "Milk Punch":"Cognac / Calvados",
  "Orange Brulée":"Cognac / Calvados",
  "Orange Custard Cocktail":"Cognac / Calvados",
  "Parisian Spring Punch":"Cognac / Calvados",
  "Playmate Martini":"Cognac / Calvados",
  "Preakness Manhattan":"Cognac / Calvados",
  "Queen's Knees":"Cognac / Calvados",
  "Regent's Punch":"Cognac / Calvados",
  "Renaissance":"Cognac / Calvados",
  "Ritz Sidecar":"Cognac / Calvados",
  "Sidecar":"Cognac / Calvados",
  "Sidecar No. Blue":"Cognac / Calvados",
  "Stinger":"Cognac / Calvados",
  "Strega Chocolate (Accoutrement)":"Cognac / Calvados",
  "Sumo In A Sidecar":"Cognac / Calvados",
  "The Addington":"Cognac / Calvados",
  "The Continental Exchange":"Cognac / Calvados",
  "The StiG":"Cognac / Calvados",
  "Tiramisu":"Cognac / Calvados",
  "Tiramisu Cocktail":"Cognac / Calvados",
  "Vieux Carre":"Cognac / Calvados",
  "Vieux Carré":"Cognac / Calvados",
  "Wardroom":"Cognac / Calvados",
  "Widow's Kiss":"Cognac / Calvados",
  "Widows Kiss":"Cognac / Calvados",
  "Yule Luv It":"Cognac / Calvados",
  "Zoom":"Cognac / Calvados",
  // Gin
  "20th Century Cocktail":"Gin",
  "Absinthe Martini":"Gin",
  "Alaska":"Gin",
  "Alaska (Straub's 1914 recipe)":"Gin",
  "Alpine Negroni":"Gin",
  "Angel Face":"Gin",
  "Angel's Advocate":"Gin",
  "Aviation":"Gin",
  "Aviation Cocktail (Difford's recipe)":"Gin",
  "Banana Calling":"Gin",
  "Bee's Knees":"Gin",
  "Bees Knees":"Gin",
  "Bermondsey Minute":"Gin",
  "Biggles Aviation":"Gin",
  "Bijou":"Gin",
  "Bikini Martini":"Gin",
  "Black Negroni":"Gin",
  "Blackthorn":"Gin",
  "Blackthorn (English)":"Gin",
  "Blackthorn No. 5":"Gin",
  "Boston Deluxe":"Gin",
  "Bradford Martini":"Gin",
  "Bramble":"Gin",
  "Breakfast Martini":"Gin",
  "Bronx":"Gin",
  "Buttercup":"Gin",
  "Cardinale":"Gin",
  "Celery Century":"Gin",
  "Celery Gimlet No.2":"Gin",
  "Charlie Chaplin":"Gin",
  "Cherry Springer":"Gin",
  "Christmas Negroni":"Gin",
  "Christmas Velvet Alexander":"Gin",
  "Claridge Cocktail":"Gin",
  "Clover Club":"Gin",
  "Clover Club (House-Made)":"Gin",
  "Cobbler":"Gin",
  "Collins":"Gin",
  "Columbia Skin":"Gin",
  "Comte de Sureau":"Gin",
  "Copenhagen Cocktail":"Gin",
  "Corpse Reviver No. Blue":"Gin",
  "Corpse Reviver No.2":"Gin",
  "Corpse Reviver No.2 (Contemporary Recipe)":"Gin",
  "Cucumber Gimlet":"Gin",
  "Daisy Buchanan":"Gin",
  "Darlington":"Gin",
  "Difford's Fruit Cup No.1":"Gin",
  "Dirty Martini":"Gin",
  "Dry Martini":"Gin",
  "Dutch Breakfast Cocktail":"Gin",
  "Dutch Courage":"Gin",
  "Earl Grey MarTEAni":"Gin",
  "Elderflower Collins":"Gin",
  "Enzoni":"Gin",
  "Ernst Happel":"Gin",
  "Fairbanks No.1":"Gin",
  "Fall Into Spring Negroni":"Gin",
  "Fat Cat":"Gin",
  "Favola":"Gin",
  "Fifty-Fifty Martini":"Gin",
  "Final Ward":"Gin",
  "First Word":"Gin",
  "Fitzgerald":"Gin",
  "Floradora":"Gin",
  "Fluffy Duck":"Gin",
  "Ford Cocktail":"Gin",
  "Ford cocktail":"Gin",
  "Franklin's 15:1 Martini":"Gin",
  "French 75":"Gin",
  "Fresh White Lady":"Gin",
  "Gibson":"Gin",
  "Gimlet":"Gin",
  "Gin & Tonic":"Gin",
  "Gin Alexander":"Gin",
  "Gin Basil Smash":"Gin",
  "Gin Blossom Martini":"Gin",
  "Gin Fizz":"Gin",
  "Gin Fruit Cup":"Gin",
  "Gin Rickey":"Gin",
  "Gin Sour":"Gin",
  "Golden Spritz":"Gin",
  "Grand White Lady":"Gin",
  "Green Deacon":"Gin",
  "Green Eyes":"Gin",
  "Hanky Panky":"Gin",
  "Hotel Georgia":"Gin",
  "Ice in the Hat":"Gin",
  "Iron Negroni":"Gin",
  "Jasmine":"Gin",
  "John Collins":"Gin",
  "Last Word":"Gin",
  "Latest Word":"Gin",
  "Left Bank Martini":"Gin",
  "Lemony":"Gin",
  "Less is More Negroni":"Gin",
  "London Calling":"Gin",
  "London Gypsy":"Gin",
  "Loose Talk":"Gin",
  "Luigi":"Gin",
  "Marsala Martini":"Gin",
  "Martinez":"Gin",
  "Martini":"Gin",
  "Milanese Breakfast Martini":"Gin",
  "Milanese G&T":"Gin",
  "Mint Cocktail":"Gin",
  "Minty Pentones":"Gin",
  "Monkey's Paw":"Gin",
  "MonteNegroni":"Gin",
  "Mule's Hind Leg":"Gin",
  "Murano Negroni":"Gin",
  "Navigator":"Gin",
  "Negroni":"Gin",
  "Negroni Bianco Bergamotto":"Gin",
  "Obituary Martini":"Gin",
  "Old Friend":"Gin",
  "Old Vermont":"Gin",
  "Perfect Negroni":"Gin",
  "Pink Gin":"Gin",
  "Pink Gin & Tonic":"Gin",
  "Pink Lady":"Gin",
  "Pinky Negroni":"Gin",
  "Poet's Dream":"Gin",
  "Prince Henry":"Gin",
  "Procrastination Cocktail":"Gin",
  "Psychopathia Sexualis":"Gin",
  "Ramos Chocolate Fizz":"Gin",
  "Ramos Gin Fizz":"Gin",
  "Rapscallion":"Gin",
  "Red Lion":"Gin",
  "Rhubarb & Custard Cocktail":"Gin",
  "Rose":"Gin",
  "Sabot":"Gin",
  "Saffron Royale":"Gin",
  "Sake Martini":"Gin",
  "Sakura Martini":"Gin",
  "San Francisco (Café Royal)":"Gin",
  "Satan's Whiskers":"Gin",
  "Savoy Corpse Reviver":"Gin",
  "Sawyer":"Gin",
  "Sheroni":"Gin",
  "Sherry Negroni":"Gin",
  "Singapore Sling":"Gin",
  "Singapore Sling (Dale DeGroff's recipe)":"Gin",
  "Sloe Gin Fizz":"Gin",
  "Sloe Gin Negroni":"Gin",
  "Sloegroni":"Gin",
  "Slow Screw":"Gin",
  "South Side":"Gin",
  "South Side Rickey":"Gin",
  "Southside":"Gin",
  "Southside Fizz":"Gin",
  "Southside Rickey":"Gin",
  "Spring Feeling":"Gin",
  "Suffering Bastard":"Gin",
  "The Astor":"Gin",
  "The Business":"Gin",
  "The Last Word":"Gin",
  "The Mayflower Martini":"Gin",
  "The Savelberg":"Gin",
  "Tirreno":"Gin",
  "Tom Collins":"Gin",
  "Tulip":"Gin",
  "Turbo Shandy":"Gin",
  "Turtle Dove":"Gin",
  "Tuxedo":"Gin",
  "Vancouver":"Gin",
  "Venus in Furs":"Gin",
  "VerMillion Fizz":"Gin",
  "White Lady":"Gin",
  "White Negroni":"Gin",
  "Wibble":"Gin",
  "Wild Blossom":"Gin",
  "Wordsmith":"Gin",
  "Xanthia":"Gin",
  "Yellow Daisy":"Gin",
  // Liqueur
  "Adriatique Cocktail":"Liqueur",
  "Alabama Slammer":"Liqueur",
  "B-52 Shot":"Liqueur",
  "Canary Flip":"Liqueur",
  "China Blue Cocktail":"Liqueur",
  "Chrysanthemum":"Liqueur",
  "Ciao Bella":"Liqueur",
  "Coffee & Tonic":"Liqueur",
  "Corpse Reviver No.4":"Liqueur",
  "Garibaldicus":"Liqueur",
  "Grasshopper":"Liqueur",
  "IPAlicus":"Liqueur",
  "Italian Sun":"Liqueur",
  "Italicup":"Liqueur",
  "Jaffa Cake (Jaffa Martini)":"Liqueur",
  "Japanese Slipper":"Liqueur",
  "Jeez Louise":"Liqueur",
  "Jägerita":"Liqueur",
  "L'Arte Della Bellezza":"Liqueur",
  "Lemon Meringue Pie'tini":"Liqueur",
  "Port Charlotte":"Liqueur",
  "Rhubarb & Custard":"Liqueur",
  "Roman Highball":"Liqueur",
  "Snowball":"Liqueur",
  "Spiked Arnold Palmer":"Liqueur",
  "Sugar My Plums":"Liqueur",
  "The Queen's Steeple":"Liqueur",
  "Tip Top":"Liqueur",
  "Valencia":"Liqueur",
  // Mezcal
  "1910":"Mezcal",
  "Aventura":"Mezcal",
  "Barbacoa":"Mezcal",
  "Cannonball":"Mezcal",
  "Closing Argument":"Mezcal",
  "Crystal Ship":"Mezcal",
  "Division Bell":"Mezcal",
  "Dragon Punch":"Mezcal",
  "Fire & Brimstone":"Mezcal",
  "Garden Sour":"Mezcal",
  "Grasshopper No. 2":"Mezcal",
  "Last Palabra":"Mezcal",
  "M & M":"Mezcal",
  "Mezcal Dante":"Mezcal",
  "Mezcal Fruit Cup":"Mezcal",
  "Mezcal Margarita":"Mezcal",
  "Mezcal Negroni":"Mezcal",
  "Mezcal Stone Sour":"Mezcal",
  "Mezcalero":"Mezcal",
  "Mission Bell":"Mezcal",
  "Naked and Famous":"Mezcal",
  "Oaxacan Negroni":"Mezcal",
  "Oaxacan Old Fashioned":"Mezcal",
  "Pastry War Margarita":"Mezcal",
  "Port of Spain (by Dominic Alling)":"Mezcal",
  "Pura Vida":"Mezcal",
  "S 'n' Emm":"Mezcal",
  "Smoke & Mirrors (mezcal-based)":"Mezcal",
  "Smoky Cokey":"Mezcal",
  "Spicy Smoky Margarita":"Mezcal",
  "Tommy's Mezcal Margarita":"Mezcal",
  "Ultima Palabra":"Mezcal",
  "Velasco & Sand":"Mezcal",
  "When The Smoke Cleared":"Mezcal",
  // Pisco
  "Avenue San Martin":"Pisco",
  "Club Cocktail (Difford's recipe)":"Pisco",
  "Club Cocktail (my recipe)":"Pisco",
  "Double Grape":"Pisco",
  "Dulchin":"Pisco",
  "Mosquito":"Pisco",
  "Mrs Daisy Robinson":"Pisco",
  "Paddington Bear Martini":"Pisco",
  "Peruvian Elder Sour":"Pisco",
  "Pinecone":"Pisco",
  "Pini":"Pisco",
  "Pisco Collins":"Pisco",
  "Pisco Kid":"Pisco",
  "Pisco Punch":"Pisco",
  "Pisco Punch (Difford's Recipe)":"Pisco",
  "Pisco Punch (Micheli's recipe)":"Pisco",
  "Pisco Punch (Prosser's recipe)":"Pisco",
  "Pisco Sour":"Pisco",
  "Pisco Sour (my recipe)":"Pisco",
  "Pyramid Punch":"Pisco",
  "Stonage":"Pisco",
  "Yellow Negroni":"Pisco",
  // Rhum
  "Acapulco":"Rhum",
  "Aged Honey Daiquiri":"Rhum",
  "Airmail":"Rhum",
  "Aku Aku":"Rhum",
  "Angel's Draft":"Rhum",
  "Bahama Mama":"Rhum",
  "Banana Daiquiri":"Rhum",
  "Banana Daiquiri (shaken)":"Rhum",
  "Batida Rosa":"Rhum",
  "Beach Blonde":"Rhum",
  "Bitter in Brazil":"Rhum",
  "Brasil":"Rhum",
  "Brass Rail":"Rhum",
  "Brazil 66":"Rhum",
  "Brazil Basil Smash":"Rhum",
  "Brazilian Contessa":"Rhum",
  "Brazuca Remedy":"Rhum",
  "Burning Bright":"Rhum",
  "Cachaça Fruit Cup":"Rhum",
  "Caipirinha":"Rhum",
  "Canchànchara":"Rhum",
  "Caneflower":"Rhum",
  "Caribbean Sazerac":"Rhum",
  "Chanbanger Cocktail":"Rhum",
  "Coconut Rum Punch":"Rhum",
  "Colonel Ward":"Rhum",
  "Creole Cosmo":"Rhum",
  "Cuba Libre":"Rhum",
  "Curtain Call":"Rhum",
  "Daiquiri":"Rhum",
  "Daiquiri No.1":"Rhum",
  "Daiquiri on-the-rocks":"Rhum",
  "Daisy de Santiago":"Rhum",
  "Dark 'n' Stormy":"Rhum",
  "Dark and Stormy":"Rhum",
  "Dark n Stormy":"Rhum",
  "Dirty Banana":"Rhum",
  "Dublin Minstrel":"Rhum",
  "Edison's Medicine":"Rhum",
  "El Presidente":"Rhum",
  "Esmeralda":"Rhum",
  "Fantasticus":"Rhum",
  "Floral Daiquiri":"Rhum",
  "Fog Cutter":"Rhum",
  "Fog Cutter (Bramble-style)":"Rhum",
  "For Sake's Sake":"Rhum",
  "French Daiquiri":"Rhum",
  "Frozen Daiquiri":"Rhum",
  "German Vacation":"Rhum",
  "Green Swizzle":"Rhum",
  "Hemingway Daiquiri":"Rhum",
  "Hemingway Special (Papa Doble)":"Rhum",
  "Honeysuckle":"Rhum",
  "Honeysuckle Daiquiri":"Rhum",
  "Hotel Nacional":"Rhum",
  "Hotel Nacional Special":"Rhum",
  "Hummingbird":"Rhum",
  "Hunter's Verdict":"Rhum",
  "Hurricane":"Rhum",
  "In the August Sun":"Rhum",
  "Iz Bananaz":"Rhum",
  "Jamie's Mojito":"Rhum",
  "Jelly Belly Beany":"Rhum",
  "Kamaniwanalaya":"Rhum",
  "King's Jubilee":"Rhum",
  "Kingston Negroni":"Rhum",
  "Knickerbocker":"Rhum",
  "La Cola Nostra":"Rhum",
  "Larchmont":"Rhum",
  "Lavarello":"Rhum",
  "Lemon Beat":"Rhum",
  "Lost Plane":"Rhum",
  "Macunaíma":"Rhum",
  "Mai Tai":"Rhum",
  "Mai Tai (Difford's recipe)":"Rhum",
  "Maple Rum Old Fashioned":"Rhum",
  "Mary Pickford":"Rhum",
  "Missionary's Downfall":"Rhum",
  "Mississippi Punch":"Rhum",
  "Mojito":"Rhum",
  "Mr Bali Hai":"Rhum",
  "Night in Tunisia":"Rhum",
  "Nuclear Banana Daiquiri":"Rhum",
  "Nuclear Daiquiri":"Rhum",
  "Old Cuban":"Rhum",
  "Orinoco":"Rhum",
  "Orinoco Cocktail":"Rhum",
  "Painkiller":"Rhum",
  "Parisian Blond":"Rhum",
  "Passion Fruit Rum Punch":"Rhum",
  "Peach Tea":"Rhum",
  "Pina Colada":"Rhum",
  "Pineapple & Mint Caipirinha":"Rhum",
  "Pink Daiquiri":"Rhum",
  "Planter's Punch":"Rhum",
  "Planters Punch":"Rhum",
  "Port of Spain":"Rhum",
  "Presidente":"Rhum",
  "Queen's Park Hotel Super Cocktail":"Rhum",
  "Queen's Park Swizzle":"Rhum",
  "Rabo-de-Galo":"Rhum",
  "Reggae Rum Punch":"Rhum",
  "Right Hand":"Rhum",
  "Ron Collins":"Rhum",
  "Royal Bermuda Yacht Club":"Rhum",
  "Royal Mojito":"Rhum",
  "Rum Alexander":"Rhum",
  "Rum Cobbler":"Rhum",
  "Rum Old Fashioned":"Rhum",
  "Rum Punch":"Rhum",
  "Rum Shrub":"Rhum",
  "Rum Swizzle":"Rhum",
  "Rumshack Punch":"Rhum",
  "Salvatore Meets":"Rhum",
  "Shark's Tooth No.1 (Trader Vic's)":"Rhum",
  "Sharman-Cox Daiquiri":"Rhum",
  "Summa Peto":"Rhum",
  "Sweet Grape Caipirinha":"Rhum",
  "Swizzle":"Rhum",
  "The Malagueña":"Rhum",
  "The Moment":"Rhum",
  "Three Dots and a Dash":"Rhum",
  "Ti Punch":"Rhum",
  "Ti' Punch":"Rhum",
  "Tiki Max":"Rhum",
  "Toblerone":"Rhum",
  "Trinidad Sour":"Rhum",
  "Tropical Itch":"Rhum",
  "Turkish Delight (Persepolis)":"Rhum",
  "Vanessa Polk":"Rhum",
  "Waldorf Daiquiri":"Rhum",
  "Waters of Chaos":"Rhum",
  "Winter":"Rhum",
  "Winter Solace":"Rhum",
  "Zombie":"Rhum",
  // Sherry
  "Adonis":"Sherry",
  "Bamboo":"Sherry",
  "Bergamot & Coconut Cobbler":"Sherry",
  "Bergamot Bamboo":"Sherry",
  "Byculla":"Sherry",
  "Rollergirl":"Sherry",
  "Sherry Cobbler":"Sherry",
  "Spring Green":"Sherry",
  // Spritz
  "Aperitivo Spritz":"Spritz",
  "Aperol Spritz":"Spritz",
  "Casa Savoia Spritz":"Spritz",
  "Death Star":"Spritz",
  "Fruit Cup Spritz":"Spritz",
  "Hugo":"Spritz",
  "Limoncello Spritz":"Spritz",
  "Negroni Sbagliato":"Spritz",
  "Parma Violet (Parma Violet Spritz)":"Spritz",
  "Sbagliato":"Spritz",
  "Sips Sgroppino":"Spritz",
  "Spring Fresh Spritz":"Spritz",
  "Spritz":"Spritz",
  "Spritz Veneziano":"Spritz",
  "Spritzer Fresco":"Spritz",
  // Tequila
  "Amaretto Tequila Old Fashioned":"Tequila",
  "Azalea Margarita":"Tequila",
  "Añejo Manhattan":"Tequila",
  "Añogo":"Tequila",
  "Batanga":"Tequila",
  "Bird of Paradise":"Tequila",
  "Brave Bull":"Tequila",
  "Cadáver Reviver":"Tequila",
  "Californian Margarita":"Tequila",
  "Dama Blanca":"Tequila",
  "Death Flip":"Tequila",
  "Dried Meadow Flower":"Tequila",
  "Eclipse Cocktail":"Tequila",
  "El Diablo":"Tequila",
  "Ernest + Rita":"Tequila",
  "Italian Margarita":"Tequila",
  "Lemon Sherbet Margarita":"Tequila",
  "Margarita":"Tequila",
  "Margarita on-the-rocks (Difford's)":"Tequila",
  "Maria Theresa Margarita":"Tequila",
  "Medicina Latina":"Tequila",
  "Mexican Mule":"Tequila",
  "Mexico City":"Tequila",
  "Michelada":"Tequila",
  "Monte Paloma":"Tequila",
  "Monterita":"Tequila",
  "New York Minute":"Tequila",
  "Palo Negro":"Tequila",
  "Paloma":"Tequila",
  "Passion Fruit Margarita":"Tequila",
  "Picante de la Casa":"Tequila",
  "Ranch Water":"Tequila",
  "Rosarita Margarita":"Tequila",
  "Rude Cosmopolitan":"Tequila",
  "Sandy The Showgirl":"Tequila",
  "Silk Road":"Tequila",
  "Silk Stocking Cocktail":"Tequila",
  "Slow Comfortable Mexican Screw Against The Wall":"Tequila",
  "Smokestack Lightning":"Tequila",
  "Spicy Margarita":"Tequila",
  "Sunny Disposition":"Tequila",
  "Tamarind Margarita":"Tequila",
  "Tequila Alexander":"Tequila",
  "Tequila Martini":"Tequila",
  "Tequila Old Fashioned":"Tequila",
  "Tequila Sunrise":"Tequila",
  "The Broady":"Tequila",
  "The Dante":"Tequila",
  "Tommy's Margarita":"Tequila",
  "Vampiro":"Tequila",
  // Vodka
  "Absolute Gangster":"Vodka",
  "Adios Motherfucker":"Vodka",
  "Alexander The Great":"Vodka",
  "Apple Martini":"Vodka",
  "Bellini-Tini":"Vodka",
  "Bernice":"Vodka",
  "Black Russian":"Vodka",
  "Black Widow's Bite":"Vodka",
  "Bloody Mary":"Vodka",
  "Bon Bon":"Vodka",
  "Bucket":"Vodka",
  "Bucket List":"Vodka",
  "Bullshot":"Vodka",
  "Caipiroska":"Vodka",
  "Casablanca No.2":"Vodka",
  "Chinese Whisper":"Vodka",
  "Chocolate Orange Espresso Martini":"Vodka",
  "Colorado Bulldog":"Vodka",
  "Cosmonaut":"Vodka",
  "Cosmopolitan":"Vodka",
  "Courtside":"Vodka",
  "Creme Egg Cocktail":"Vodka",
  "Crystal Clear":"Vodka",
  "Crème Anglaise Cocktail":"Vodka",
  "Cucumber Sake-Tini":"Vodka",
  "Dairy Milk Chocolate":"Vodka",
  "Daisy Cutter Martini":"Vodka",
  "Dawa":"Vodka",
  "Dirty Vodka Martini":"Vodka",
  "Electric Lemonade":"Vodka",
  "Espresso Martini":"Vodka",
  "Four Aces":"Vodka",
  "French Martini":"Vodka",
  "Fruit Salad":"Vodka",
  "Fruity Sex on the Beach":"Vodka",
  "Geisha Martini":"Vodka",
  "Ginger Cosmo":"Vodka",
  "Ginger Martini":"Vodka",
  "Gingerbread":"Vodka",
  "Godmother":"Vodka",
  "Grand Cosmopolitan":"Vodka",
  "Greyhounds Tooth":"Vodka",
  "Harvey Wallbanger":"Vodka",
  "Honey Cosmopolitan":"Vodka",
  "Hudson Mule":"Vodka",
  "Japanese Pear":"Vodka",
  "La Dolce Vita":"Vodka",
  "Lemon Drop":"Vodka",
  "Long Island Iced Tea":"Vodka",
  "Lotus Espresso":"Vodka",
  "Love Heart":"Vodka",
  "Marshmallow (Marshmallow 'Martini')":"Vodka",
  "Moscow Mule":"Vodka",
  "Motox":"Vodka",
  "One Sip Martini":"Vodka",
  "Palm Royale Grasshopper":"Vodka",
  "Pan Galactic Gargle Blaster":"Vodka",
  "Passion Fruit Martini":"Vodka",
  "Pernelle":"Vodka",
  "Pineapple Martini":"Vodka",
  "Polish Martini":"Vodka",
  "Pooh'tini":"Vodka",
  "Porn Star Martini":"Vodka",
  "Pornstar Martini":"Vodka",
  "Raspberry Martini":"Vodka",
  "Red Earl":"Vodka",
  "Ruby":"Vodka",
  "Russian Spring Punch":"Vodka",
  "Saketini":"Vodka",
  "Sakini":"Vodka",
  "Salty Dog":"Vodka",
  "Screaming Orgasm":"Vodka",
  "Screwdriver":"Vodka",
  "Sea Breeze":"Vodka",
  "Sex on the Beach":"Vodka",
  "Sgroppino Sorbetto":"Vodka",
  "Shaft":"Vodka",
  "Smarties (Smartini)":"Vodka",
  "Sunset Vibes":"Vodka",
  "Tomatini":"Vodka",
  "Tootie Fruity (Tootie Fruity Lifesaver)":"Vodka",
  "Vacation Martini":"Vodka",
  "Vanilla Espresso Martini":"Vodka",
  "Vesper Dry Martini":"Vodka",
  "Vodka Collins":"Vodka",
  "Vodka Martini":"Vodka",
  "Vodka Stinger":"Vodka",
  "Voyager Vodka Martini":"Vodka",
  "Warsaw Cooler":"Vodka",
  "White Russian":"Vodka",
  "Woo Woo":"Vodka",
  "Yellow Belly":"Vodka",
  "Yellow Fever":"Vodka",
  "Zuzus Petals":"Vodka",
  // Whisky
  "100-year-old-cigar":"Whisky",
  "A Dream to Be":"Whisky",
  "A Moment of Silence":"Whisky",
  "Affinity":"Whisky",
  "Almond Atholl Brose":"Whisky",
  "Amaretto Manhattan":"Whisky",
  "Anejo Manhattan":"Whisky",
  "Bakewell Tart Sour":"Whisky",
  "Barbary Coast":"Whisky",
  "Bensonhurst":"Whisky",
  "Benton's Old Fashioned":"Whisky",
  "Bessie & Jessie":"Whisky",
  "Black Manhattan":"Whisky",
  "Blinker (Hawksmoor's Riff)":"Whisky",
  "Blood and Sand":"Whisky",
  "Blue Blazer":"Whisky",
  "Bobby Burns":"Whisky",
  "Boston Sour":"Whisky",
  "Boulevardier":"Whisky",
  "Brooklyn":"Whisky",
  "Brooklyn (perfect)":"Whisky",
  "Brown Derby":"Whisky",
  "Bubo Bubo":"Whisky",
  "Cablegram":"Whisky",
  "Cameron's Kick":"Whisky",
  "Casa Savoia Boulevardier":"Whisky",
  "Circus Circus":"Whisky",
  "Clan MacLeod":"Whisky",
  "Clandestine":"Whisky",
  "Coco Geisha":"Whisky",
  "Colleen Bawn":"Whisky",
  "Cowboy Derby":"Whisky",
  "Damm It Jimmy":"Whisky",
  "Damn It Jimmy":"Whisky",
  "Dantes in Fernet":"Whisky",
  "De La Louisiane":"Whisky",
  "De La Louisiane No.4":"Whisky",
  "Detroit Athletic Club":"Whisky",
  "Diamondback":"Whisky",
  "Dublin Spider Highball":"Whisky",
  "Easy Speak":"Whisky",
  "Eclipse":"Whisky",
  "Enrico Palazzo":"Whisky",
  "Fancy Free":"Whisky",
  "Five Keys":"Whisky",
  "Flannel Shirt":"Whisky",
  "Frisco Sour":"Whisky",
  "Fumigator Flip":"Whisky",
  "Game Set Match":"Whisky",
  "Georgia Mint Julep":"Whisky",
  "Gingerbread Old Fashioned":"Whisky",
  "Godfather":"Whisky",
  "Gold Rush":"Whisky",
  "Greenpoint":"Whisky",
  "Haberdasher":"Whisky",
  "Haystack Cocktail":"Whisky",
  "Hearn Cocktail":"Whisky",
  "Hi Falutin":"Whisky",
  "High King":"Whisky",
  "Highland Sling":"Whisky",
  "Holy Joe Cocktail":"Whisky",
  "Honey Badger":"Whisky",
  "Honey Cobbler":"Whisky",
  "Honey Sour":"Whisky",
  "Horse's Neck":"Whisky",
  "Hot Toddy":"Whisky",
  "Hunter Cocktail":"Whisky",
  "Hunter-cocktail":"Whisky",
  "Irish Cocktail":"Whisky",
  "Irish Coffee":"Whisky",
  "Irish Maid":"Whisky",
  "Irish Old Fashioned":"Whisky",
  "Kentucky Buck":"Whisky",
  "Kingston Club":"Whisky",
  "Left Hand":"Whisky",
  "Lion's Tail":"Whisky",
  "Little Italy":"Whisky",
  "Lone Oak":"Whisky",
  "Made Man":"Whisky",
  "Madurised Old Fashioned":"Whisky",
  "Man O' War":"Whisky",
  "Manhattan":"Whisky",
  "Maple Old Fashioned":"Whisky",
  "Maple Sour":"Whisky",
  "Midnight Over Tennessee":"Whisky",
  "Midnight Stinger":"Whisky",
  "Mint Julep":"Whisky",
  "Mizuwari":"Whisky",
  "Monte Carlo":"Whisky",
  "Monte Cassino":"Whisky",
  "Moo'lata":"Whisky",
  "Mountain Man Cocktail":"Whisky",
  "Naughty Charles":"Whisky",
  "New York Sour":"Whisky",
  "New York Stone Sour":"Whisky",
  "Old Fashioned":"Whisky",
  "Old Pal":"Whisky",
  "Paper Plane":"Whisky",
  "Parle-vous Irish":"Whisky",
  "Peach Me":"Whisky",
  "Peach Old-fashioned (Wisconsin-style)":"Whisky",
  "Peat's Dragon":"Whisky",
  "Penicillin":"Whisky",
  "Perfect Manhattan":"Whisky",
  "Pippin No.2":"Whisky",
  "Port of Spain Cocktail":"Whisky",
  "Pot of Gold":"Whisky",
  "Praecocia Cocktail":"Whisky",
  "Preakness":"Whisky",
  "Presbyterian":"Whisky",
  "Prescription Julep":"Whisky",
  "Psycho Killer Cocktail":"Whisky",
  "R U Bobby Moore?":"Whisky",
  "Rattlesnake":"Whisky",
  "Red Hook":"Whisky",
  "Remember the Maine":"Whisky",
  "Rob Roy":"Whisky",
  "Ruby Manhattan":"Whisky",
  "Rusty Nail":"Whisky",
  "Sake Manhattan":"Whisky",
  "Sazerac":"Whisky",
  "Scotch Sour":"Whisky",
  "Sin Cyn cocktail":"Whisky",
  "Smoking Gun":"Whisky",
  "Sunflower":"Whisky",
  "Sweet Manhattan":"Whisky",
  "The Saint":"Whisky",
  "There It Is...":"Whisky",
  "Tootsie Roll":"Whisky",
  "Toronto":"Whisky",
  "Touchwood":"Whisky",
  "Tratto Limoncello Cocktail":"Whisky",
  "Velocipede":"Whisky",
  "Velvet Old Fashioned":"Whisky",
  "Waldorf Cocktail No.1":"Whisky",
  "Ward Eight":"Whisky",
  "Warday's":"Whisky",
  "Warday's Cocktail":"Whisky",
  "Whiskey Smash":"Whisky",
  "Whiskey Sour":"Whisky",
  "Whisky Butter":"Whisky",
  "Whisky Mac":"Whisky",
  "Wild Turkey Sour":"Whisky",
  "Winchester":"Whisky",
};

const FAMILY_ORDER = ["Absinthe","Amaretto","Campari","Champagne","Chartreuse","Cognac / Calvados","Gin","Liqueur","Mezcal","Pisco","Rhum","Sherry","Spritz","Tequila","Vodka","Whisky"];

function getCocktailFamily(name) {
  return COCKTAIL_FAMILY_MAP[name] || "Autre";
}

async function fetchRecommendations({ classique, variation, gout, ingredientToChange, barIngredients, tasteProfile, excludeNames=[], mode="classique", customCocktails=[] }) {
  // Build family context — e.g. "Whisky (Bourbon, Rye, Scotch)"
  const familyContext = BAR_FAMILIES
    .filter(f => f.members.some(m => barIngredients.includes(m)))
    .map(f => {
      const owned = f.members.filter(m => barIngredients.includes(m));
      return `${f.label} (${owned.join(", ")})`;
    }).join("; ");

  const barContext = barIngredients.length > 0
    ? `The user's bar contains: ${familyContext}. BAR CONSTRAINT RULE (apply to the gradient): Cocktails 1-10 (close proposals) MUST be makeable with the user's bar ingredients — consider all members of each family as available (e.g. Bourbon = any whisky). Cocktails 11-15 (explorations) should mostly use bar ingredients but may introduce 1 ingredient not in the bar. Cocktails 16-20 (discoveries) are free — the user may not have all ingredients but these are aspirational discoveries.`
    : "The user has no bar restrictions — recommend freely across all 20 cocktails.";

  const profileContext = tasteProfile.length > 0
    ? `The user's taste profile based on favorites: ${tasteProfile.map(t => t.tag).join(", ")}. Flavor vocabulary: ${FLAVOR_TAGS.join(", ")}.`
    : `No taste profile yet. Flavor vocabulary: ${FLAVOR_TAGS.join(", ")}.`;

  const excludeContext = excludeNames.length > 0
    ? `Do NOT include these cocktails: ${excludeNames.join(", ")}.`
    : "";

  // Get the classique's flavor tags for context
  const classiqueTags = classique ? (typeof COCKTAIL_TAGS !== "undefined" ? COCKTAIL_TAGS[classique] || [] : []) : [];
  const classiqueTagsStr = classiqueTags.length > 0 ? classiqueTags.join(", ") : "unknown";

  let prompt = "";
  if (mode === "classique_variation_ingredient") {
    // Par les ingrédients: ingredient changes progressively, characteristics stay close
    const classiqueRecipe = typeof RECIPES !== "undefined" ? RECIPES[classique] : null;
    const otherIngs = classiqueRecipe
      ? classiqueRecipe.ingredients.map(i => i.name).filter(i => i !== ingredientToChange).join(", ")
      : "other classic ingredients";
    prompt = `You are proposing 20 cocktail variations of the ${classique}, replacing its ingredient "${ingredientToChange}".
The ${classique} has these flavor characteristics: ${classiqueTagsStr}.
Its other ingredients are: ${otherIngs}.

GRADIENT STRUCTURE — from closest to most adventurous:
• Cocktails 1-5 (VERY CLOSE): Replace "${ingredientToChange}" with a similar alternative. Keep ALL other ingredients (${otherIngs}) if possible. Maintain 3-4 of the original flavor characteristics (${classiqueTagsStr}). May add 1 new complementary ingredient.
• Cocktails 6-10 (CLOSE): Replace "${ingredientToChange}" and begin modifying 1-2 other ingredients. Keep 2-3 original flavor characteristics.
• Cocktails 11-15 (EXPLORATIONS): More ingredients changed, some new ones added. Keep 1-2 original flavor characteristics.
• Cocktails 16-20 (DISCOVERIES): Freely reimagined. Keep at least 1 original flavor characteristic as a thread. Ingrédients libres.

The user's taste profile (use as a guide, not a filter): ${profileContext}
${barContext}
${excludeContext}`;

  } else if (mode === "classique_variation_gout") {
    // Par la caractéristique: chosen tag stays constant, ingredients drift progressively
    const classiqueRecipe = typeof RECIPES !== "undefined" ? RECIPES[classique] : null;
    const classiqueIngs = classiqueRecipe
      ? classiqueRecipe.ingredients.map(i => i.name).join(", ")
      : "classic ingredients";
    prompt = `You are proposing 20 cocktail variations of the ${classique}, all sharing the characteristic "${gout}".
The ${classique} is made with: ${classiqueIngs}.
Its flavor characteristics: ${classiqueTagsStr}.

GRADIENT STRUCTURE — from closest to most adventurous. ALL 20 cocktails MUST feature the "${gout}" characteristic:
• Cocktails 1-5 (VERY CLOSE): Same spirit base and most ingredients as ${classique}. Characteristic "${gout}" present. Stay close to original recipe.
• Cocktails 6-10 (CLOSE): Same spirit family but ingredients begin to differ. "${gout}" characteristic strong.
• Cocktails 11-15 (EXPLORATIONS): Different spirits and ingredients, but "${gout}" remains the central thread.
• Cocktails 16-20 (DISCOVERIES): Freely reimagined recipes from any spirit. "${gout}" is the only constant.

The user's taste profile (use as a guide, not a filter): ${profileContext}
${barContext}
${excludeContext}`;

  } else if (mode === "classique_mixologue") {
    // Mixologue decides: both characteristics AND ingredients drift together
    const classiqueRecipe = typeof RECIPES !== "undefined" ? RECIPES[classique] : null;
    const classiqueIngs = classiqueRecipe
      ? classiqueRecipe.ingredients.map(i => i.name).join(", ")
      : "classic ingredients";
    prompt = `You are proposing 20 cocktail variations inspired by the ${classique} — this is the most open-ended exploration.
The ${classique} is made with: ${classiqueIngs}.
Its flavor characteristics: ${classiqueTagsStr}.

GRADIENT STRUCTURE — BOTH ingredients AND characteristics drift together from close to far:
• Cocktails 1-5 (VERY CLOSE): Very similar ingredients AND characteristics to ${classique}. Recognizable variations.
• Cocktails 6-10 (CLOSE): Ingredients begin to differ, 1-2 characteristics shift. Still in the same spirit family.
• Cocktails 11-15 (EXPLORATIONS): Noticeably different ingredients AND different characteristics. A new direction.
• Cocktails 16-20 (DISCOVERIES): Freely reimagined — different spirits, different flavor profile. The ${classique} is just the starting inspiration, not a constraint. Maximum discovery.

This is the mode of greatest discovery. Be bold with the last 5 cocktails.
The user's taste profile (use as a GUIDE for selecting within each group, not as a filter): ${profileContext}
${barContext}
${excludeContext}`;

  } else if (mode === "change_ingredient") {
    prompt = `The user is drinking a ${classique} and wants to change the ingredient "${ingredientToChange}". Recommend 20 cocktails that don't use "${ingredientToChange}" but are stylistically related to the ${classique} (characteristics: ${classiqueTagsStr}).`;

  } else if (mode === "ingredients") {
    prompt = `Search your ENTIRE cocktail knowledge for cocktails containing ANY of these ingredients: ${barIngredients.join(", ")}.
Step 1: List ALL Difford's Guide cocktails you know that use these ingredients — be exhaustive, including rare and obscure recipes (e.g. Boston Deluxe with saffron syrup, Bamboo with sherry, etc.).
Step 2: If Difford's Guide results are fewer than 20, add quality cocktails from other reputable sources (classic bartending books, contemporary bars, well-established recipes) until you reach 20 total.
Always prioritize Difford's Guide, but never limit yourself to it. Do NOT invent cocktails.
${profileContext}
${barContext}
${excludeContext}`;

  } else {
    prompt = `Recommend 20 cocktails inspired by the ${classique} (characteristics: ${classiqueTagsStr}). Search Difford's Guide first, then complement with other quality sources if needed.
${profileContext}
${barContext}
${excludeContext}`;
  }

  const fullPrompt = `${prompt}

${barContext}
${profileContext}
${excludeContext}

Difford's Guide Catalogue of ${DIFFORD_HALL_OF_FAME.length} Difford\'s Guide cocktails — use this as your primary sourcing pool, especially for positions 6-20. Here is a random sample to inspire variety: ${DIFFORD_HALL_OF_FAME.slice(Math.floor(Math.random()*200), Math.floor(Math.random()*200)+80).join(", ")}.

DIVERSITY RULES (mandatory):
- Cocktails 1-5: well-known classics are fine.
- Cocktails 6-10: prefer lesser-known Difford\'s cocktails.
- Cocktails 11-20: actively seek rare and underrated gems. Avoid Negroni, Manhattan, Old Fashioned, Daiquiri, Mojito, Margarita, Gin & Tonic unless uniquely relevant. Vary the spirit base.
- NEVER propose the same cocktail twice.

Return ONLY a raw JSON array of exactly 20 objects, no markdown, no explanation:
[{"name":"string","description":"string (main ingredients, 1 line)","emoji":"string","tags":["string"],"why":"string (one sentence explaining position in the gradient)","type":"string"}]

The 20 cocktails MUST follow the gradient structure described above:
- Objects 1-5: type "proche" — very close to starting point
- Objects 6-10: type "proche" — still close  
- Objects 11-15: type "exploration" — diverging
- Objects 16-20: type "decouverte" — maximum discovery

For EACH cocktail, add a field "source" with value "diffordsguide" if you are confident it exists on Difford's Guide, otherwise "other".
Prioritize Difford's Guide cocktails when equally relevant, but NEVER sacrifice gradient relevance to include one.
For the recipe, always use the Difford's Guide version when available.
Do NOT repeat the same cocktail twice.`;

  const response = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: `You are a world-class mixologist with encyclopedic knowledge of cocktails worldwide.
Your PRIMARY source is Difford's Guide (diffordsguide.com) — always search it exhaustively first.
When recommending cocktails with a specific ingredient, recall ALL cocktails containing that ingredient across your entire knowledge: Difford's Guide, classic bartending books, contemporary cocktail culture, and well-established recipes globally.
Do NOT limit yourself to Difford's Guide if it has few results — complement with quality recipes from other reputable sources.
Never invent cocktails. Only propose recipes you are confident exist.
Always respond with raw JSON only — no markdown, no explanation, no text outside the JSON.`,
      messages: [{ role: "user", content: fullPrompt }],
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const text = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");
  const clean = text.replace(/```json|```/g,"").trim();
  const match = clean.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array");
  const all = JSON.parse(match[0]);
  // Tag each cocktail as diffordsguide or other based on our Hall of Fame list
  // Only trust our local list — never trust Claude's self-reported source field
  const normalize = s => s?.toLowerCase().trim().replace(/['']/g, "'");
  const tagged = all.map(c => ({
    ...c,
    isDifford: DIFFORD_HALL_OF_FAME.some(name => normalize(name) === normalize(c.name)),
    isCustom: customCocktails.some(cc => normalize(cc.name) === normalize(c.name))
  }));

  // Custom cocktails always first
  const sortBySource2 = arr => [
    ...arr.filter(c => c.isCustom),
    ...arr.filter(c => !c.isCustom && c.isDifford),
    ...arr.filter(c => !c.isCustom && !c.isDifford),
  ];

  // New gradient: proche (1-10) + exploration+decouverte (11-20)
  const pourVousAll = tagged.filter(c => c.type === "proche" || c.type === "pourVous" || all.indexOf(c) < 10).slice(0,10);
  const decouvAll = tagged.filter(c => c.type === "exploration" || c.type === "decouverte" || all.indexOf(c) >= 10).slice(0,10);

  // Sort: diffordsguide first within each group
  return {
    pourVous: sortBySource2(pourVousAll),
    decouvertes: sortBySource2(decouvAll),
  };
}

async function fetchCreatedCocktail(ingredients, tasteProfile) {
  const profileContext = tasteProfile.length > 0
    ? `User taste profile: ${tasteProfile.map(t => t.tag).join(", ")}.`
    : "";
  const response = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `You are a world-class creative mixologist. Create an original cocktail recipe based on the user's selected ingredients and taste profile.
You may add complementary ingredients to balance the cocktail, but the user's selected ingredients must be the foundation.
Return ONLY a raw JSON object, no markdown:
{"name":"creative cocktail name","tagline":"one evocative sentence","glass":"string","method":"string","ingredients":[{"amount":"string in ml","name":"string","note":"optional note"}],"garnish":"string","instructions":"string in French","addedIngredients":["ingredients you added to balance"],"rationale":"why you made these choices in French"}`,
      messages: [{ role: "user", content: `Create an original cocktail using these ingredients as the base: ${ingredients.join(", ")}. ${profileContext} Make it creative but balanced. All amounts in ml.` }],
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const text = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");
  const clean = text.replace(/```json|```/g,"").trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON");
  return JSON.parse(match[0]);
}

async function fetchRecipeFromClaude(name) {
  const response = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: `You are a cocktail expert with deep knowledge of Difford's Guide recipes. 
Return ONLY a raw JSON object with no markdown, no explanation, no text before or after.
Use this exact structure:
{"glass":"string","method":"string","ingredients":[{"amount":"string","name":"string"}],"garnish":"string","instructions":"string"}
- instructions must be in French
- use exact quantities from Difford's Guide, always in ml (convert oz to ml: 1oz = 30ml, 0.5oz = 15ml, 0.75oz = 22.5ml)
- never use oz, cl or other units — ml only`,
      messages: [{ role: "user", content: `Give me the exact Difford's Guide recipe for: "${name}"` }],
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  const text = (data.content||[]).filter(b => b.type==="text").map(b => b.text).join("");
  const clean = text.replace(/```json|```/g,"").trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON");
  return JSON.parse(match[0]);
}

function findSubstitute(ingredient, allAvailable) {
  if (allAvailable.some(a => a.toLowerCase() === ingredient.toLowerCase())) return null;
  const group = SUBSTITUTIONS.find(g => g.some(i => i.toLowerCase() === ingredient.toLowerCase()));
  if (!group) return null;
  return group.find(i => i.toLowerCase() !== ingredient.toLowerCase() && allAvailable.some(a => a.toLowerCase() === i.toLowerCase())) || null;
}

function canMakeWithSubs(cocktail, stock) {
  const allAvailable = [
    ...ALWAYS_AVAILABLE,
    ...["alcools","sirops","bitters","frigo"].flatMap(cat => stock[cat] || []).map(i => i.toLowerCase()),
  ];
  const substitutions = [];
  const possible = cocktail.ingredients.every(ing => {
    if (allAvailable.some(a => a.toLowerCase() === ing.toLowerCase())) return true;
    const sub = findSubstitute(ing, allAvailable);
    if (sub) { substitutions.push({ required: ing, usedInstead: sub }); return true; }
    return false;
  });
  return { possible, substitutions };
}

// Build user taste profile from liked cocktails — uses static COCKTAIL_TAGS
function buildTasteProfile(likedNames, allCocktails) {
  const tagCounts = {};
  likedNames.forEach(name => {
    const staticTags = COCKTAIL_TAGS[name] || [];
    if (staticTags.length) {
      staticTags.forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; });
    } else {
      const cocktail = allCocktails.find(c => c.name === name);
      if (cocktail?.tags) {
        cocktail.tags.forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; });
      }
    }
  });
  return Object.entries(tagCounts).sort((a,b) => b[1]-a[1]).slice(0,8).map(([tag, count]) => ({ tag, count }));
}

// Score a cocktail against user taste profile
function profileScore(cocktail, tasteProfile) {
  if (!tasteProfile.length) return 0;
  const tags = cocktail.tags || [];
  return tasteProfile.reduce((acc, { tag, count }) => tags.includes(tag) ? acc + count : acc, 0);
}

// Generate 10 proposals: 5 "pour vous" + 5 "découvertes"
function generateProposals(candidates, tasteProfile, excludeNames=[]) {
  const pool = candidates.filter(c => !excludeNames.includes(c.name));
  const scored = pool.map(c => ({ ...c, pScore: profileScore(c, tasteProfile) }));
  scored.sort((a, b) => b.pScore - a.pScore);
  const pourVous = scored.filter(c => c.pScore > 0).slice(0, 5);
  const decouvertes = scored.filter(c => !pourVous.find(p => p.name === c.name)).slice(0, 5);
  return { pourVous, decouvertes };
}

// ── Extra ingredients for local search ─────────────────────────────────────
const EXTRA_INGREDIENTS = {
  alcools: ["Pastis","Sake","Galliano","Advocaat","Pimm's No.1","Génépi","Strega","Aquavit","Rum Agricole","Overproof Rum","Gin Navy Strength","Sotol","Aperol Spritz"],
  sirops: ["Sirop de cerise","Sirop de caramel","Sirop de cacao","Sirop d'hibiscus","Sirop de litchi","Sirop de bergamote","Sirop de menthe","Sirop de cardamome"],
  bitters: ["Underberg","Bob's Bitters","Scrappy's Bitters","Fee Brothers","Bittermens","Miracle Mile"],
  frigo: ["Kombucha","Eau de fleur d'oranger","Eau de rose","Jus de betterave","Lait d'amande","Jus de goyave","Ananas frais","Mangue fraîche","Pêche fraîche"],
};

// ── Components ─────────────────────────────────────────────────────────────
function IngredientSearch({ openCat, stock, onAdd }) {
  const [query, setQuery] = useState("");
  const allOptions = [...BAR_INVENTORY[openCat], ...(EXTRA_INGREDIENTS[openCat] || [])];
  const existing = [...BAR_INVENTORY[openCat], ...(stock[`custom_${openCat}`] || [])].map(i => i.toLowerCase());
  const suggestions = query.length >= 2 ? allOptions.filter(i => i.toLowerCase().includes(query.toLowerCase()) && !existing.includes(i.toLowerCase())).slice(0, 8) : [];

  return (
    <div style={{ border:`1px dashed ${FAINT}`, borderRadius:12, padding:16, marginBottom:24, position:"relative" }}>
      <div style={{ fontSize:"0.8rem", color:MUTED, marginBottom:10 }}>🔍 Ajouter un ingrédient</div>
      <input value={query} onChange={e => setQuery(e.target.value)}
        placeholder={openCat === "alcools" ? "Ex : Calvados, Midori…" : openCat === "sirops" ? "Ex : Falernum, orgeat…" : openCat === "bitters" ? "Ex : Cardamom bitters…" : "Ex : Ginger beer…"}
        style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,0.03)", border:`1px solid ${FAINT}`, borderRadius:8, padding:"10px 14px", color:"#e8e0d0", fontSize:"0.85rem", fontFamily:"Georgia, serif", outline:"none" }} />
      {suggestions.length > 0 && (
        <div style={{ position:"absolute", left:16, right:16, background:"#12101a", border:`1px solid ${FAINT}`, borderRadius:10, zIndex:100, overflow:"hidden", boxShadow:"0 8px 24px rgba(0,0,0,0.5)", marginTop:4 }}>
          {suggestions.map((s, i) => (
            <button key={s} onMouseDown={() => { onAdd(s); setQuery(""); }}
              style={{ width:"100%", background:"transparent", border:"none", borderBottom:i<suggestions.length-1?`1px solid ${FAINT}`:"none", padding:"11px 16px", color:"#a09080", cursor:"pointer", fontSize:"0.85rem", textAlign:"left", fontFamily:"Georgia, serif", display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ color:GOLD, fontSize:"0.7rem" }}>+</span>{s}
            </button>
          ))}
        </div>
      )}
      {query.length >= 2 && suggestions.length === 0 && (
        <button onMouseDown={() => { if(query.trim()) { onAdd(query.trim()); setQuery(""); } }}
          style={{ marginTop:10, background:"rgba(201,169,110,0.1)", border:`1px solid ${GOLD}`, borderRadius:8, padding:"8px 14px", color:GOLD, cursor:"pointer", fontSize:"0.82rem", fontFamily:"Georgia, serif" }}>
          + Ajouter "{query}"
        </button>
      )}
    </div>
  );
}

// Recipe card component (reusable) — fetches from Claude if not in local DB
function RecipeCard({ name, localRecipe, onClose, onFavorite, isFavorite, onChangeIngredient }) {
  const [recipe, setRecipe] = useState(localRecipe || null);
  const [loading, setLoading] = useState(!localRecipe);
  const [error, setError] = useState(false);
  const [customTags, setCustomTags] = useState(TAGS_CACHE[name] || []);
  const [tagsLoading, setTagsLoading] = useState(false);

  // Static tags for known cocktails, dynamic for custom ones
  const staticTags = COCKTAIL_TAGS[name] || [];
  const tags = staticTags.length > 0 ? staticTags : customTags;
  const isCustomCocktail = staticTags.length === 0;

  useEffect(() => {
    if (!localRecipe) {
      setLoading(true);
      fetchRecipeFromClaude(name)
        .then(r => { setRecipe(r); setLoading(false); })
        .catch(() => { setError(true); setLoading(false); });
    }
    // Auto-generate tags for custom cocktails if not cached
    if (isCustomCocktail && !TAGS_CACHE[name]) {
      generateCustomTags();
    } else if (TAGS_CACHE[name]) {
      setCustomTags(TAGS_CACHE[name]);
    }
  }, [name]);

  async function generateCustomTags() {
    if (tagsLoading) return;
    setTagsLoading(true);
    try {
      const r = localRecipe || recipe;
      const ings = (r?.ingredients || []).map(i => i.name || i).filter(Boolean).join(", ");
      const desc = r?.description || name;
      const res = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 100,
          system: "Return ONLY a JSON array of 3-4 strings. No markdown, no explanation.",
          messages: [{ role: "user", content: `Pick 3-4 flavor tags for this cocktail from ONLY this list: ${FLAVOR_TAGS.join(", ")}. Cocktail: "${name}". ${ings ? "Ingredients: " + ings + "." : ""} ${desc ? "Description: " + desc : ""} Reply with ONLY a JSON array like: ["tag1","tag2","tag3"]` }],
        }),
      });
      const data = await res.json();
      if (data.content) {
        const text = data.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
        const s = text.indexOf("["), e = text.lastIndexOf("]");
        if (s !== -1 && e !== -1) {
          const parsed = JSON.parse(text.slice(s, e + 1));
          const valid = parsed.filter(t => FLAVOR_TAGS.includes(t)).slice(0, 4);
          if (valid.length > 0) {
            TAGS_CACHE[name] = valid;
            setCustomTags(valid);
          }
        }
      }
    } catch(e) { /* silent fail */ }
    setTagsLoading(false);
  }

  if (loading) return (
    <div style={{ textAlign:"center", padding:"60px 0" }}>
      <div style={{ fontSize:"2rem", marginBottom:16, animation:"spin 1s linear infinite" }}>🍸</div>
      <div style={{ color:MUTED, fontSize:"0.9rem", fontStyle:"italic" }}>Recherche de la recette sur diffordsguide…</div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!recipe || error) return (
    <div style={{ textAlign:"center", padding:"40px 0" }}>
      <div style={{ fontSize:"2rem", marginBottom:16 }}>😔</div>
      <div style={{ color:MUTED, fontSize:"0.9rem", marginBottom:12 }}>Recette introuvable pour "{name}"</div>
      <a href={diffordsUrl(name)} target="_blank" rel="noopener noreferrer" style={{ color:GOLD, fontSize:"0.82rem" }}>Voir sur diffordsguide.com →</a>
    </div>
  );
  return (
    <div>
      <h2 style={{ fontSize:"1.6rem", fontWeight:"normal", color:GOLD, margin:"0 0 6px 0" }}>{name}</h2>
      <div style={{ display:"flex", gap:10, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
        {DIFFORD_HALL_OF_FAME.some(n => n.toLowerCase() === name.toLowerCase()) && (
          <span style={{ fontSize:"0.72rem", color:GOLD, background:"rgba(201,169,110,0.1)", border:`1px solid rgba(201,169,110,0.4)`, borderRadius:20, padding:"4px 12px", letterSpacing:"0.05em" }}>✦ Recette Difford's Guide</span>
        )}
        {recipe.glass && <span style={{ fontSize:"0.78rem", color:MUTED, background:"rgba(255,255,255,0.03)", border:`1px solid ${FAINT}`, borderRadius:20, padding:"4px 12px" }}>🥃 {recipe.glass}</span>}
        {recipe.method && <span style={{ fontSize:"0.78rem", color:MUTED, background:"rgba(255,255,255,0.03)", border:`1px solid ${FAINT}`, borderRadius:20, padding:"4px 12px" }}>⚗️ {recipe.method}</span>}
      </div>
      <div style={{ marginBottom:20, minHeight:26 }}>
        {tags.length > 0 ? (
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            {tags.map(tag => (
              <span key={tag} style={{ fontSize:"0.75rem", color:"#c0a0ff", background:"rgba(120,80,200,0.1)", border:"1px solid rgba(120,80,200,0.3)", borderRadius:20, padding:"3px 10px" }}>
                {tag}
              </span>
            ))}
          </div>
        ) : tagsLoading ? (
          <span style={{ fontSize:"0.72rem", color:"#4a3a5a", fontStyle:"italic" }}>✦ analyse des saveurs…</span>
        ) : isCustomCocktail ? (
          <button onClick={generateCustomTags}
            style={{ fontSize:"0.72rem", color:"#6a5a7a", background:"transparent", border:"1px solid #2a2035", borderRadius:20, padding:"3px 12px", cursor:"pointer", fontFamily:"Georgia, serif" }}>
            ✦ analyser les saveurs
          </button>
        ) : null}
      </div>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:"0.75rem", color:MUTED, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:12 }}>Ingrédients</div>
        {(recipe.ingredients || []).map((ing, i) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${FAINT}` }}>
            <span style={{ color:"#e8e0d0", fontSize:"0.9rem" }}>{ing.name}</span>
            <span style={{ color:GOLD, fontSize:"0.85rem" }}>{ing.amount}</span>
          </div>
        ))}
      </div>
      {recipe.garnish && <div style={{ marginBottom:16 }}><div style={{ fontSize:"0.75rem", color:MUTED, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>Garniture</div><div style={{ color:"#a09080", fontSize:"0.88rem" }}>{recipe.garnish}</div></div>}
      {recipe.instructions && <div style={{ marginBottom:24 }}><div style={{ fontSize:"0.75rem", color:MUTED, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>Préparation</div><div style={{ color:"#a09080", fontSize:"0.88rem", lineHeight:1.6 }}>{recipe.instructions}</div></div>}

      <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:8 }}>
        <button onClick={onFavorite} style={{ width:"100%", background:isFavorite ? "rgba(201,169,110,0.05)" : "rgba(201,169,110,0.1)", border:`1px solid ${GOLD}`, borderRadius:12, padding:"13px", color:GOLD, cursor:"pointer", fontSize:"0.9rem", fontFamily:"Georgia, serif" }}>
          {isFavorite ? "❤️ Dans vos favoris" : "🤍 Ajouter aux favoris"}
        </button>
        <button onClick={() => onChangeIngredient(recipe)} style={{ width:"100%", background:"rgba(255,255,255,0.02)", border:`1px solid #2a2535`, borderRadius:12, padding:"13px", color:"#a09080", cursor:"pointer", fontSize:"0.9rem", fontFamily:"Georgia, serif" }}>
          🔄 Changer un ingrédient
        </button>
        <button onClick={onClose} style={{ width:"100%", background:"transparent", border:"none", padding:"10px", color:MUTED, cursor:"pointer", fontSize:"0.85rem", fontFamily:"Georgia, serif" }}>
          Fermer
        </button>
      </div>
    </div>
  );
}

// Proposals list component
function CocktailCard({ c, isPourVous, onSelect }) {
  const isDifford = c.isDifford;
  const isCustom = c.isCustom || c.tags?.includes("custom");
  const borderColor = isCustom ? "rgba(120,80,200,0.5)" : isDifford ? "rgba(201,169,110,0.4)" : FAINT;
  const bgColor = isCustom ? "rgba(120,80,200,0.08)" : isDifford ? "rgba(201,169,110,0.07)" : "rgba(255,255,255,0.02)";
  const nameColor = isCustom ? "#c0a0ff" : isDifford ? GOLD : "#e8e0d0";
  return (
    <button onClick={() => onSelect(c)}
      style={{ width:"100%", background:bgColor, border:`1px solid ${borderColor}`, borderRadius:12, padding:"14px 12px", cursor:"pointer", textAlign:"left", display:"flex", flexDirection:"column", alignItems:"flex-start", gap:6, transition:"all 0.2s", minHeight:90 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, width:"100%" }}>
        <span style={{ fontSize:"1.3rem" }}>{c.emoji || "🍸"}</span>
        <div style={{ flex:1 }}>
          <div style={{ color:nameColor, fontSize:"0.85rem", lineHeight:1.3 }}>{c.name}</div>
          {isCustom && <div style={{ fontSize:"0.62rem", color:"rgba(120,80,200,0.8)", marginTop:2, letterSpacing:"0.05em" }}>⭐ MON COCKTAIL</div>}
          {!isCustom && isDifford && <div style={{ fontSize:"0.62rem", color:"rgba(201,169,110,0.7)", marginTop:2, letterSpacing:"0.05em" }}>✦ DIFFORD'S GUIDE</div>}
        </div>
      </div>
      <div style={{ color:MUTED, fontSize:"0.72rem", lineHeight:1.4 }}>{c.description}</div>
      {c.why && <div style={{ color:"#5a4a3a", fontSize:"0.68rem", fontStyle:"italic", lineHeight:1.3 }}>{c.why}</div>}
    </button>
  );
}

function ProposalsList({ pourVous, decouvertes, onSelect }) {
  return (
    <div>
      {pourVous.length > 0 && (
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:"0.72rem", color:GOLD, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:14 }}>⭐ Pour vous ({pourVous.length})</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {pourVous.map(c => <CocktailCard key={c.name} c={c} isPourVous={true} onSelect={onSelect} />)}
          </div>
        </div>
      )}
      {decouvertes.length > 0 && (
        <div>
          <div style={{ fontSize:"0.72rem", color:"#7a6a9a", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:14 }}>🔭 Découvertes ({decouvertes.length})</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {decouvertes.map(c => <CocktailCard key={c.name} c={c} isPourVous={false} onSelect={onSelect} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function MixologueApp() {
  const EMPTY_PROFILES = { Jerome: { liked:[] }, Evgenia: { liked:[] } };

  const [screen, setScreen] = useState("home"); // home | userMenu | quiz | bar | mycocktails | creation | catalog
  const [currentUser, setCurrentUser] = useState(null);
  const [profiles, setProfiles] = useState(EMPTY_PROFILES);
  const [stock, setStock] = useState(EMPTY_STOCK);
  const [customCocktails, setCustomCocktails] = useState([]);

  // Quiz state
  const [quizPath, setQuizPath] = useState(null); // "classique"|"ingredients"|"name"|"favoris"
  const [quizStep, setQuizStep] = useState(0);
  const [selectedClassique, setSelectedClassique] = useState(null);
  const [selectedGout, setSelectedGout] = useState(null);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [nameSearch, setNameSearch] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [proposals, setProposals] = useState({ pourVous:[], decouvertes:[] });
  const [selectedCocktail, setSelectedCocktail] = useState(null);
  const [changeIngMode, setChangeIngMode] = useState(false);
  const [changeIngList, setChangeIngList] = useState([]);

  // Bar state
  const [openCat, setOpenCat] = useState("alcools");
  const [exportCode, setExportCode] = useState(null);
  const [importInput, setImportInput] = useState("");
  const [importError, setImportError] = useState(false);

  // Custom cocktail form
  const [customForm, setCustomForm] = useState({ name:"", description:"", emoji:"🍹", ingredients:[], tags:[], recipe:{ glass:"", method:"", garnish:"", instructions:"", ingredients:[] } });
  const [customFormStep, setCustomFormStep] = useState(0);

  const [loadingRecs, setLoadingRecs] = useState(false);
  const [creationMode, setCreationMode] = useState(false);
  const [viewingCustomRecipe, setViewingCustomRecipe] = useState(null);
  const [creationIngredients, setCreationIngredients] = useState([]);
  const [createdRecipe, setCreatedRecipe] = useState(null);
  const [loadingCreation, setLoadingCreation] = useState(false);
  const [expandedFamilies, setExpandedFamilies] = useState({});
  const [recsError, setRecsError] = useState(false);
  const [notification, setNotification] = useState(null);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogSelected, setCatalogSelected] = useState(null);

  const [loadingStorage, setLoadingStorage] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [jerBar, evgBar, jerFavs, evgFavs, jerCustom, evgCustom] = await Promise.all([
        loadProfile("Jerome"), loadProfile("Evgenia"),
        loadFavorites("Jerome"), loadFavorites("Evgenia"),
        loadCustomCocktails("Jerome"), loadCustomCocktails("Evgenia"),
      ]);
      setProfiles({ Jerome: { liked: jerFavs }, Evgenia: { liked: evgFavs } });
      window._allBars = { Jerome: jerBar, Evgenia: evgBar };
      const jerBarData = jerBar || {};
      if (Object.keys(jerBarData).length > 0) setStock({ ...EMPTY_STOCK, ...jerBarData });
      else { const s = localStorage.getItem("mixo-stock"); if (s) setStock({ ...EMPTY_STOCK, ...JSON.parse(s) }); }
      if (jerCustom.length > 0) setCustomCocktails(jerCustom);
      else { const c = localStorage.getItem("mixo-custom"); if (c) setCustomCocktails(JSON.parse(c)); }
    } catch(e) {
      console.error("Supabase load error:", e);
      try {
        const p = localStorage.getItem("mixo-profiles");
        const s = localStorage.getItem("mixo-stock");
        const c = localStorage.getItem("mixo-custom");
        if (p) setProfiles(JSON.parse(p));
        if (s) setStock({ ...EMPTY_STOCK, ...JSON.parse(s) });
        if (c) setCustomCocktails(JSON.parse(c));
      } catch(e2) {}
    }
    setLoadingStorage(false);
  }

  async function saveProfiles(updated) {
    setProfiles(updated);
    localStorage.setItem("mixo-profiles", JSON.stringify(updated));
    if (currentUser) {
      const prev = profiles[currentUser]?.liked || [];
      const next = updated[currentUser]?.liked || [];
      for (const n of next.filter(x => !prev.includes(x))) await addFavorite(currentUser, n);
      for (const n of prev.filter(x => !next.includes(x))) await removeFavorite(currentUser, n);
    }
  }
  async function saveStock(updated) {
    setStock(updated);
    localStorage.setItem("mixo-stock", JSON.stringify(updated));
    if (currentUser) {
      try {
        await saveProfile(currentUser, updated);
        console.log("Bar saved to Supabase for", currentUser);
      } catch(e) { console.error("Bar save error:", e); }
      if (!window._allBars) window._allBars = {};
      window._allBars[currentUser] = updated;
    }
  }
  async function saveCustom(updated) {
    setCustomCocktails(updated);
    localStorage.setItem("mixo-custom", JSON.stringify(updated));
    if (currentUser) await saveAllCustomCocktails(currentUser, updated);
  }

  function showNotif(msg) { setNotification(msg); setTimeout(() => setNotification(null), 2500); }

  function allCocktails() { return [...customCocktails, ...COCKTAIL_DB]; } // custom first

  function tasteProfile() { return buildTasteProfile(profiles[currentUser]?.liked || [], allCocktails()); }

  function isLiked(name) {
    return (profiles[currentUser]?.liked || []).some(item =>
      typeof item === "string" ? item === name : item?.name === name
    );
  }

  async function toggleLike(name) {
    const updated = { ...profiles };
    const liked = updated[currentUser]?.liked || [];
    const likedNames = liked.map(item => typeof item === "string" ? item : item?.name);
    if (likedNames.includes(name)) {
      updated[currentUser].liked = likedNames.filter(n => n !== name);
      showNotif("Retiré des favoris");
      if (currentUser) {
        await removeFavorite(currentUser, name);
        console.log("Removed from Supabase:", name);
      }
    } else {
      updated[currentUser].liked = [...likedNames, name];
      showNotif("❤️ Ajouté aux favoris !");
      if (currentUser) {
        await addFavorite(currentUser, name);
        console.log("Added to Supabase:", name);
      }
    }
    setProfiles(updated);
    localStorage.setItem("mixo-profiles", JSON.stringify(updated));
  }

  function toggleIngredient(cat, item) {
    const updated = { ...stock };
    if ((updated[cat]||[]).includes(item)) {
      updated[cat] = updated[cat].filter(i => i !== item);
      const ck = `custom_${cat}`;
      if ((updated[ck]||[]).includes(item)) updated[ck] = updated[ck].filter(i => i !== item);
    } else { updated[cat] = [...(updated[cat]||[]), item]; }
    saveStock(updated);
  }

  function addCustomIngredient(cat, name) {
    const ck = `custom_${cat}`;
    const all = [...BAR_INVENTORY[cat], ...(stock[ck]||[])];
    if (all.some(i => i.toLowerCase() === name.toLowerCase())) { showNotif("Déjà dans la liste !"); return; }
    const updated = { ...stock };
    updated[ck] = [...(updated[ck]||[]), name];
    updated[cat] = [...(updated[cat]||[]), name];
    saveStock(updated);
    showNotif(`✓ "${name}" ajouté !`);
  }

  function getBarIngredients() {
    return ["alcools","sirops","bitters","frigo"].flatMap(c => stock[c] || []);
  }

  function barIsEmpty() { return getBarIngredients().length === 0; }

  // Returns display list for ingredient selection — grouped by family for alcools
  function getBarDisplayList() {
    if (barIsEmpty()) {
      // Show all families as labels
      return BAR_FAMILIES.map(f => ({ label: f.label, emoji: f.emoji, members: f.members, isFamily: true }))
        .concat(BAR_INVENTORY.sirops.map(s => ({ label: s, emoji: "🍯", members: [s], isFamily: false })))
        .concat(BAR_INVENTORY.bitters.map(b => ({ label: b, emoji: "🧪", members: [b], isFamily: false })))
        .concat(BAR_INVENTORY.frigo.map(f => ({ label: f, emoji: "🧊", members: [f], isFamily: false })));
    }
    // Bar has items — show active alcool families + active other ingredients
    const activeAlcools = BAR_FAMILIES.filter(f => f.members.some(m => (stock.alcools||[]).includes(m)))
      .map(f => ({ label: f.label, emoji: f.emoji, members: f.members, isFamily: true }));
    const otherActives = ["sirops","bitters","frigo"].flatMap(cat =>
      (stock[cat]||[]).map(item => ({ label: item, emoji: CAT_LABELS[cat].emoji, members: [item], isFamily: false }))
    );
    return [...activeAlcools, ...otherActives];
  }

  function filterByStock(cocktailList) {
    if (barIsEmpty()) return cocktailList.map(c => ({ ...c, substitutions:[], possible:true }));
    return cocktailList.map(c => { const { possible, substitutions } = canMakeWithSubs(c, stock); return { ...c, possible, substitutions }; }).filter(c => c.possible);
  }

  // ── Quiz logic ──────────────────────────────────────────────────────────
  function startUserMenu(user) { setCurrentUser(user); setScreen("userMenu"); }

  function startCreation() {
    setCreationMode(true);
    setCreationIngredients([]);
    setCreatedRecipe(null);
    setScreen("creation");
  }

  function toggleCreationIng(ing) {
    setCreationIngredients(prev =>
      prev.includes(ing) ? prev.filter(i => i !== ing) : prev.length < 5 ? [...prev, ing] : prev
    );
  }

  async function createCocktail() {
    if (creationIngredients.length === 0) return;
    setLoadingCreation(true);
    setCreatedRecipe(null);
    try {
      const recipe = await fetchCreatedCocktail(creationIngredients, tasteProfile());
      setCreatedRecipe(recipe);
    } catch(e) { showNotif("Erreur lors de la création — réessayez"); }
    setLoadingCreation(false);
  }

  function saveCreatedCocktail() {
    if (!createdRecipe) return;
    const newC = {
      name: createdRecipe.name,
      description: createdRecipe.tagline || createdRecipe.ingredients?.map(i=>i.name).join(", "),
      emoji: "🧪",
      ingredients: createdRecipe.ingredients?.map(i => i.name) || [],
      tags: ["custom","created"],
      variation: "variation",
      classique: "Custom",
      recipe: createdRecipe,
      isCustom: true,
    };
    saveCustom([...customCocktails, newC]);
    showNotif(`✓ "${createdRecipe.name}" ajouté à vos cocktails !`);
  }

  function startQuiz(path) {
    setQuizPath(path);
    setQuizStep(0);
    setSelectedClassique(null);
    setSelectedGout(null);
    setSelectedIngredients([]);
    setNameSearch("");
    setNameError(false);
    setProposals({ pourVous:[], decouvertes:[] });
    setSelectedCocktail(null);
    setChangeIngMode(false);
    setScreen("quiz");
  }

  function selectClassique(name) {
    setSelectedClassique(name);
    setQuizStep(1); // classique or variation?
  }

  function selectVariationOrClassique(choice) {
    if (choice === "classique") {
      // Find the classique cocktail in local data
      const c = allCocktails().find(c => c.classique === selectedClassique && c.variation === "classique");
      if (c) {
        setSelectedCocktail(c);
      } else {
        // Cocktail not in local data — use name directly (Difford's Guide will fetch the recipe)
        setSelectedCocktail({ name: selectedClassique, classique: selectedClassique, variation: "classique", emoji: "🍸", description: "", ingredients: [] });
      }
      setQuizStep(10);
    } else {
      setQuizStep(2); // goût or ingrédients?
    }
  }

  async function selectVariationType(type) {
    if (type === "saveur") { setQuizStep(3); }
    else if (type === "ingredient") { setQuizStep(4); }
    else if (type === "mixologue") {
      // Claude proposes freely based on the classique and user profile
      setLoadingRecs(true);
      setRecsError(false);
      setQuizStep(5);
      try {
        const result = await fetchRecommendations({
          classique: selectedClassique,
          barIngredients: getBarIngredients(),
          tasteProfile: tasteProfile(),
          customCocktails,
          excludeNames: profiles[currentUser]?.liked || [],
          mode: "classique_mixologue",
        });
        setProposals(result);
      } catch(e) { setRecsError(true); }
      setLoadingRecs(false);
    }
  }

  async function selectGout(gout) {
    setSelectedGout(gout);
    setLoadingRecs(true);
    setRecsError(false);
    setQuizStep(5);
    try {
      const result = await fetchRecommendations({
        classique: selectedClassique,
        gout,
        barIngredients: getBarIngredients(),
        tasteProfile: tasteProfile(),
        excludeNames: profiles[currentUser]?.liked || [],
        mode: "classique_variation_gout",
            customCocktails,
      });
      setProposals(result);
    } catch(e) { setRecsError(true); }
    setLoadingRecs(false);
  }

  async function selectClassiqueIngredientToChange(ingredient) {
    setLoadingRecs(true);
    setRecsError(false);
    setQuizStep(5);
    try {
      const result = await fetchRecommendations({
        classique: selectedClassique,
        ingredientToChange: ingredient,
        barIngredients: getBarIngredients(),
        tasteProfile: tasteProfile(),
        excludeNames: profiles[currentUser]?.liked || [],
        mode: "classique_variation_ingredient",
            customCocktails,
      });
      setProposals(result);
    } catch(e) { setRecsError(true); }
    setLoadingRecs(false);
  }

  function selectCocktailFromList(cocktail) {
    setSelectedCocktail(cocktail);
    setChangeIngMode(false);
    setQuizStep(10); // recipe screen
  }

  function initiateChangeIngredient(cocktail, recipeData) {
    // Use recipe ingredients if available, fallback to cocktail.ingredients
    const ings = recipeData?.ingredients?.map(i => i.name) || 
                 getRecipe(cocktail.name, customCocktails)?.ingredients?.map(i => i.name) || 
                 cocktail.ingredients || [];
    setChangeIngList(ings);
    setChangeIngMode(true);
    setQuizStep(11);
  }

  async function changeIngredient(ingredient) {
    setLoadingRecs(true);
    setRecsError(false);
    setChangeIngMode(false);
    setQuizStep(5);
    try {
      const result = await fetchRecommendations({
        classique: selectedCocktail?.name || selectedCocktail?.classique,
        ingredientToChange: ingredient,
        barIngredients: getBarIngredients(),
        tasteProfile: tasteProfile(),
        excludeNames: [selectedCocktail?.name, ...(profiles[currentUser]?.liked || [])].filter(Boolean),
        mode: "change_ingredient",
            customCocktails,
      });
      setProposals(result);
    } catch(e) { setRecsError(true); }
    setLoadingRecs(false);
  }

  // Option 2: by ingredients
  function toggleSelectedIng(ing) {
    setSelectedIngredients(prev => prev.includes(ing) ? prev.filter(i => i !== ing) : prev.length < 5 ? [...prev, ing] : prev);
  }

  async function searchByIngredients() {
    setLoadingRecs(true);
    setRecsError(false);
    setQuizStep(5);
    try {
      // Expand family labels to all their members for Claude
      const expanded = selectedIngredients.flatMap(ing => {
        const family = BAR_FAMILIES.find(f => f.label === ing || f.members[0] === ing);
        return family ? family.members : [ing];
      });
      const result = await fetchRecommendations({
        barIngredients: expanded,
        tasteProfile: tasteProfile(),
        excludeNames: profiles[currentUser]?.liked || [],
        mode: "ingredients",
            customCocktails,
      });
      setProposals(result);
    } catch(e) { setRecsError(true); }
    setLoadingRecs(false);
  }

  // Option 3: by name — search local DB first, then accept any name for Claude to find recipe
  async function searchByName() {
    const q = nameSearch.trim();
    if (!q) return;

    // 1. Check local DB first
    const found = allCocktails().find(c =>
      c.name.toLowerCase() === q.toLowerCase() ||
      c.name.toLowerCase().includes(q.toLowerCase())
    );
    if (found) {
      setSelectedCocktail(found);
      setNameError(false);
      setQuizStep(10);
      return;
    }

    // 2. Not in local DB — ask Claude to verify it exists on diffordsguide and get details
    setNameLoading(true);
    setNameError(false);
    try {
      const response = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 600,
          system: `You are a cocktail expert. Check if a cocktail exists on Difford's Guide. Return ONLY a raw JSON object: {"exists":true/false,"name":"exact name","emoji":"one emoji","description":"main ingredients in one line","isDiffordsGuide":true/false}. If not on Difford's but real, set exists:true and isDiffordsGuide:false. If doesn't exist, set exists:false.`,
          messages: [{ role: "user", content: `Does "${q}" exist as a cocktail on Difford's Guide?` }],
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const text = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");
      const match = text.replace(/```json|```/g,"").trim().match(/\{[\s\S]*\}/);
      if (!match) throw new Error("parse");
      const info = JSON.parse(match[0]);

      if (!info.exists) {
        setNameError(true);
        setNameLoading(false);
        return;
      }

      // 3. Cocktail exists — create object and show recipe
      const cocktailObj = {
        name: info.name || q,
        emoji: info.emoji || "🍸",
        description: info.description || "",
        ingredients: [],
        tags: info.isDiffordsGuide ? ["diffordsguide"] : [],
        classique: null,
        variation: null,
        isDifford: info.isDiffordsGuide,
        isNewFromSearch: true, // flag to auto-add to custom list
      };
      setSelectedCocktail(cocktailObj);
      setNameError(false);
      setQuizStep(10);

      // 4. Auto-add to custom cocktails if not already in DB
      if (!customCocktails.find(c => c.name.toLowerCase() === cocktailObj.name.toLowerCase())) {
        const newCustom = {
          ...cocktailObj,
          isCustom: false,
          fromSearch: true,
        };
        await saveCustom([...customCocktails, newCustom]);
      }
    } catch(e) {
      setNameError(true);
    }
    setNameLoading(false);
  }

  // Option 4: favorites
  function selectFavorite(name) {
    const c = allCocktails().find(c => c.name === name);
    if (c) {
      setSelectedCocktail(c);
    } else {
      // Cocktail from Difford's or external — create minimal object
      setSelectedCocktail({ name, classique: name, variation: "classique", emoji: "🍸", description: "", ingredients: [] });
    }
    setQuizStep(10);
  }

  // Export/import
  function generateExportCode() {
    const data = { stock, profiles, customCocktails };
    setExportCode(btoa(unescape(encodeURIComponent(JSON.stringify(data)))));
  }
  async function importFromCode() {
    try {
      const data = JSON.parse(decodeURIComponent(escape(atob(importInput.trim()))));
      if (data.stock) await saveStock({ ...EMPTY_STOCK, ...data.stock });
      if (data.profiles) await saveProfiles(data.profiles);
      if (data.customCocktails) await saveCustom(data.customCocktails);
      setImportInput(""); setImportError(false); showNotif("✓ Données restaurées !");
    } catch(e) { setImportError(true); }
  }

  const totalInStock = getBarIngredients().length;
  const navBtn = { background:"none", border:"none", color:MUTED, cursor:"pointer", fontSize:"0.85rem", fontFamily:"Georgia, serif" };
  const S = { page:{ minHeight:"100vh", width:"100%", background:"linear-gradient(135deg,#0a0a0f 0%,#12101a 50%,#0f0d15 100%)", fontFamily:"Georgia, serif", color:"#e8e0d0", position:"relative" } };

  if (loadingStorage) return <div style={{ ...S.page, display:"flex", alignItems:"center", justifyContent:"center" }}><div style={{ color:GOLD, fontSize:"1.2rem" }}>Chargement...</div></div>;

  const profile = tasteProfile();
  // Normalize liked list — handle both string and legacy object format
  const currentLiked = (profiles[currentUser]?.liked || []).map(item => typeof item === "string" ? item : item?.name).filter(Boolean);

  return (
    <div style={S.page}>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, background:"radial-gradient(ellipse at 20% 80%,rgba(201,169,110,0.06) 0%,transparent 60%)" }} />
      {notification && <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", background:"#1a1520", border:`1px solid ${GOLD}`, borderRadius:12, padding:"12px 24px", color:GOLD, zIndex:1000, fontSize:"0.9rem", boxShadow:"0 4px 30px rgba(201,169,110,0.3)", animation:"fadeIn 0.3s ease" }}>{notification}</div>}
      <style>{`*{box-sizing:border-box;margin:0;padding:0}html,body,#root{width:100%!important;height:100%!important;min-height:100vh!important;overflow-x:hidden}@keyframes fadeIn{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}.ucard:hover{border-color:#c9a96e!important;background:rgba(201,169,110,0.08)!important;transform:translateY(-3px)}.nav:hover{color:#c9a96e!important}.opt:hover{background:rgba(201,169,110,0.15)!important;border-color:#c9a96e!important}.prop:hover{border-color:#c9a96e!important;background:rgba(201,169,110,0.06)!important}input:focus,textarea:focus{outline:none;border-color:#c9a96e!important}input::placeholder,textarea::placeholder{color:#3a2a2a}`}</style>

      <div style={{ position:"relative", zIndex:1, maxWidth:640, width:"100%", margin:"0 auto", padding:"0 clamp(16px, 4vw, 24px)", boxSizing:"border-box" }}>

        {/* ── HOME ── */}
        {screen === "home" && (
          <div style={{ animation:"slideUp 0.5s ease", paddingTop:60, paddingBottom:40 }}>
            <div style={{ textAlign:"center", marginBottom:50 }}>
              <div style={{ fontSize:"3rem", marginBottom:16 }}>🍸</div>
              <h1 style={{ fontSize:"2.4rem", fontWeight:"normal", color:GOLD, letterSpacing:"0.05em", margin:0 }}>Le Mixologue</h1>
              <p style={{ color:"#8a7a6a", marginTop:12, fontSize:"1rem", fontStyle:"italic" }}>Votre conseiller cocktail personnel</p>
            </div>
            <p style={{ textAlign:"center", color:"#a09080", marginBottom:36, fontSize:"0.95rem" }}>Qui êtes-vous ce soir ?</p>
            <div style={{ display:"flex", gap:20, marginBottom:32 }}>
              {USERS.map(user => (
                <div key={user} className="ucard" onClick={() => startUserMenu(user)}
                  style={{ flex:1, border:`1px solid #2a2535`, borderRadius:16, padding:"28px 20px", textAlign:"center", cursor:"pointer", background:"rgba(255,255,255,0.02)", transition:"all 0.25s ease" }}>
                  <div style={{ fontSize:"2.5rem", marginBottom:12 }}>{user==="Jerome"?"🧔":"👩"}</div>
                  <div style={{ fontSize:"1.2rem", color:"#e8e0d0", marginBottom:6 }}>{user}</div>
                  <div style={{ fontSize:"0.78rem", color:MUTED }}>{(profiles[user]?.liked||[]).length} favori{(profiles[user]?.liked||[]).length!==1?"s":""}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:12, marginBottom:12 }}>
              <button className="nav" onClick={() => setScreen("bar")} style={{ ...navBtn, flex:1, border:`1px solid #2a2535`, borderRadius:12, padding:"14px", textAlign:"center", color:"#a09080", fontSize:"0.85rem" }}>
                🍾 Mon Bar {totalInStock > 0 ? `(${totalInStock})` : ""}
              </button>
              <button className="nav" onClick={() => setScreen("mycocktails")} style={{ ...navBtn, flex:1, border:`1px solid #2a2535`, borderRadius:12, padding:"14px", textAlign:"center", color:"#a09080", fontSize:"0.85rem" }}>
                📝 Mes Cocktails {customCocktails.length > 0 ? `(${customCocktails.length})` : ""}
              </button>
            </div>
            <button className="nav" onClick={() => { setScreen("catalog"); setCatalogSearch(""); setCatalogSelected(null); }}
              style={{ ...navBtn, width:"100%", border:`1px solid rgba(201,169,110,0.3)`, borderRadius:12, padding:"14px", textAlign:"center", color:GOLD, fontSize:"0.85rem", background:"rgba(201,169,110,0.04)" }}>
              ✦ Catalogue Difford's Guide ({DIFFORD_HALL_OF_FAME.length + customCocktails.filter(c => c.fromSearch).length} recettes)
            </button>
          </div>
        )}

        {/* ── USER MENU ── */}
        {screen === "userMenu" && (
          <div style={{ animation:"slideUp 0.4s ease", paddingTop:50, paddingBottom:40 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:40 }}>
              <button onClick={() => setScreen("home")} className="nav" style={navBtn}>← Accueil</button>
              <span style={{ color:GOLD, fontSize:"0.85rem" }}>{currentUser}</span>
            </div>

            {/* Taste profile */}
            {profile.length > 0 && (
              <div style={{ marginBottom:32, padding:"16px 20px", background:"rgba(201,169,110,0.04)", border:`1px solid ${FAINT}`, borderRadius:14 }}>
                <div style={{ fontSize:"0.72rem", color:MUTED, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>Votre profil gustatif</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {profile.map(({ tag, count }) => (
                    <span key={tag} style={{ background:`rgba(201,169,110,${Math.min(0.08 + count * 0.05, 0.25)})`, border:`1px solid rgba(201,169,110,${Math.min(0.2 + count * 0.1, 0.6)})`, borderRadius:20, padding:"4px 12px", fontSize:"0.8rem", color:GOLD }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <h2 style={{ fontSize:"1.1rem", fontWeight:"normal", color:"#e8e0d0", margin:"0 0 20px 0" }}>Que souhaitez-vous faire ?</h2>

            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[
                { path:"classique", icon:"🍸", label:"Choisir un classique", sub:"Partir d'un cocktail de référence et l'explorer" },
                { path:"ingredients", icon:"🍾", label:"Par ingrédients", sub:"Choisir jusqu'à 5 ingrédients de votre bar" },
                { path:"name", icon:"🔍", label:"Nom du cocktail", sub:"Rechercher un cocktail par son nom" },
                { path:"favoris", icon:"❤️", label:"Mes cocktails préférés", sub:`${currentLiked.length} favori${currentLiked.length!==1?String.fromCharCode(115):String.fromCharCode(32)}` },
              ].map(({ path, icon, label, sub }) => (
                <button key={path} onClick={() => { if(path==="favoris" && currentLiked.length===0) { showNotif("Aucun favori pour l'instant !"); return; } startQuiz(path); }}
                  className="opt" style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${FAINT}`, borderRadius:14, padding:"20px 24px", textAlign:"left", cursor:"pointer", display:"flex", alignItems:"center", gap:18, transition:"all 0.2s" }}>
                  <span style={{ fontSize:"1.8rem" }}>{icon}</span>
                  <div>
                    <div style={{ color:"#e8e0d0", fontSize:"0.95rem", marginBottom:4 }}>{label}</div>
                    <div style={{ color:MUTED, fontSize:"0.78rem", fontStyle:"italic" }}>{sub}</div>
                  </div>
                </button>
              ))}
              {/* Create cocktail — special button */}
              <button onClick={startCreation}
                className="opt" style={{ background:"rgba(120,80,200,0.06)", border:`1px solid rgba(120,80,200,0.3)`, borderRadius:14, padding:"20px 24px", textAlign:"left", cursor:"pointer", display:"flex", alignItems:"center", gap:18, transition:"all 0.2s" }}>
                <span style={{ fontSize:"1.8rem" }}>🧪</span>
                <div>
                  <div style={{ color:"#c0a0ff", fontSize:"0.95rem", marginBottom:4 }}>Créer un cocktail</div>
                  <div style={{ color:MUTED, fontSize:"0.78rem", fontStyle:"italic" }}>Le mixologue invente une recette originale pour vous</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── QUIZ ── */}
        {screen === "quiz" && (
          <div style={{ animation:"slideUp 0.4s ease", paddingTop:50, paddingBottom:40 }}>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:36 }}>
              <button onClick={() => {
                if (quizPath === "mycocktails") { setScreen("mycocktails"); return; }
                if (quizStep === 0 || quizStep === 10 && !changeIngMode) { setScreen("userMenu"); }
                else if (quizStep === 10) { setQuizStep(5); }
                else if (quizStep === 11) { setQuizStep(10); }
                else if (quizStep === 5) { setQuizStep(quizPath==="classique" ? (selectedGout ? 3 : 4) : 0); }
                else if (quizStep > 0) { setQuizStep(quizStep - 1); }
                else { setScreen("userMenu"); }
              }} className="nav" style={navBtn}>← Retour</button>
              <span style={{ color:GOLD, fontSize:"0.85rem" }}>{currentUser}</span>
            </div>

            {/* ── PATH: Classique — Step 0: choose classic ── */}
            {quizPath === "classique" && quizStep === 0 && (
              <div style={{ animation:"slideUp 0.3s ease" }}>
                <div style={{ fontSize:"1.8rem", marginBottom:12 }}>🍸</div>
                <h2 style={{ fontSize:"1.4rem", fontWeight:"normal", color:"#e8e0d0", margin:"0 0 6px 0" }}>Quel classique vous parle ?</h2>
                <p style={{ color:MUTED, fontSize:"0.82rem", fontStyle:"italic", margin:"0 0 24px 0" }}>Votre cocktail de référence</p>
                <div>
                  {CLASSIC_GROUPS.map(group => (
                    <div key={group.label} style={{ marginBottom:20 }}>
                      <div style={{ fontSize:"0.72rem", color:MUTED, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
                        <span>{group.emoji}</span>
                        <span>{group.label}</span>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                        {group.cocktails.map(opt => (
                          <button key={opt} className="opt" onClick={() => selectClassique(opt)}
                            style={{ background:selectedClassique===opt?"rgba(201,169,110,0.15)":"rgba(255,255,255,0.02)", border:`1px solid ${selectedClassique===opt?GOLD:FAINT}`, borderRadius:12, padding:"12px 14px", color:selectedClassique===opt?GOLD:"#a09080", cursor:"pointer", fontSize:"0.88rem", textAlign:"left", fontFamily:"Georgia, serif", transition:"all 0.2s" }}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── PATH: Classique — Step 1: classique or variation ── */}
            {quizPath === "classique" && quizStep === 1 && (
              <div style={{ animation:"slideUp 0.3s ease" }}>
                <div style={{ fontSize:"1.8rem", marginBottom:12 }}>🔄</div>
                <h2 style={{ fontSize:"1.4rem", fontWeight:"normal", color:"#e8e0d0", margin:"0 0 6px 0" }}>Classique ou Variation ?</h2>
                <p style={{ color:MUTED, fontSize:"0.82rem", fontStyle:"italic", margin:"0 0 32px 0" }}>Autour du <span style={{ color:GOLD }}>{selectedClassique}</span></p>
                <div style={{ display:"flex", gap:16 }}>
                  {[
                    { v:"classique", icon:"🎩", label:"Classique", sub:"La recette originale fidèle à la tradition" },
                    { v:"variation", icon:"✨", label:"Variation", sub:"Une réinterprétation créative du même univers" },
                  ].map(({ v, icon, label, sub }) => (
                    <button key={v} className="opt" onClick={() => selectVariationOrClassique(v)}
                      style={{ flex:1, border:`1px solid ${FAINT}`, borderRadius:16, padding:"28px 16px", textAlign:"center", cursor:"pointer", background:"rgba(255,255,255,0.02)", transition:"all 0.25s" }}>
                      <div style={{ fontSize:"2rem", marginBottom:12 }}>{icon}</div>
                      <div style={{ fontSize:"1rem", color:"#e8e0d0", marginBottom:6 }}>{label}</div>
                      <div style={{ fontSize:"0.75rem", color:MUTED, fontStyle:"italic" }}>{sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── PATH: Classique — Step 2: goût or ingrédients ── */}
            {quizPath === "classique" && quizStep === 2 && (
              <div style={{ animation:"slideUp 0.3s ease" }}>
                <div style={{ fontSize:"1.8rem", marginBottom:12 }}>🎛️</div>
                <h2 style={{ fontSize:"1.4rem", fontWeight:"normal", color:"#e8e0d0", margin:"0 0 6px 0" }}>Comment varier ?</h2>
                <p style={{ color:MUTED, fontSize:"0.82rem", fontStyle:"italic", margin:"0 0 32px 0" }}>Autour du <span style={{ color:GOLD }}>{selectedClassique}</span></p>
                <div style={{ display:"flex", gap:16 }}>
                  {[
                    { type:"saveur", icon:"✦", label:"Par la caractéristique", sub:"Explorer un profil gustatif différent" },
                    { type:"ingredient", icon:"🍶", label:"Par les ingrédients", sub:"Changer un ingrédient clé du classique" },
                    { type:"mixologue", icon:"🎩", label:"Proposition du Mixologue", sub:"Laissez Claude choisir pour vous" },
                  ].map(({ type, icon, label, sub }) => (
                    <button key={type} className="opt" onClick={() => selectVariationType(type)}
                      style={{ flex:1, border:type==="mixologue"?"1px solid "+GOLD:"1px solid "+FAINT, borderRadius:16, padding:"22px 12px", textAlign:"center", cursor:"pointer", background:type==="mixologue"?"rgba(201,169,110,0.05)":"rgba(255,255,255,0.02)", transition:"all 0.25s" }}>
                      <div style={{ fontSize:"1.8rem", marginBottom:10 }}>{icon}</div>
                      <div style={{ fontSize:"0.9rem", color:type==="mixologue"?GOLD:"#e8e0d0", marginBottom:6 }}>{label}</div>
                      <div style={{ fontSize:"0.72rem", color:MUTED, fontStyle:"italic" }}>{sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── PATH: Classique — Step 3: choose goût ── */}
            {quizPath === "classique" && quizStep === 3 && (
              <div style={{ animation:"slideUp 0.3s ease" }}>
                <div style={{ fontSize:"1.8rem", marginBottom:12 }}>✦</div>
                <h2 style={{ fontSize:"1.4rem", fontWeight:"normal", color:"#e8e0d0", margin:"0 0 6px 0" }}>Quelle caractéristique vous attire ?</h2>
                <p style={{ color:MUTED, fontSize:"0.82rem", fontStyle:"italic", margin:"0 0 24px 0" }}>Pour explorer autour du <span style={{ color:GOLD }}>{selectedClassique}</span></p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {FLAVOR_TAGS.map(tag => (
                    <button key={tag} className="opt" onClick={() => selectGout(tag)}
                      style={{ background:"rgba(120,80,200,0.06)", border:"1px solid rgba(120,80,200,0.25)", borderRadius:20, padding:"8px 16px", color:"#c0a0ff", cursor:"pointer", fontSize:"0.85rem", fontFamily:"Georgia, serif", transition:"all 0.2s" }}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── PATH: Classique — Step 4: choose ingredient to change ── */}
            {quizPath === "classique" && quizStep === 4 && (
              <div style={{ animation:"slideUp 0.3s ease" }}>
                <div style={{ fontSize:"1.8rem", marginBottom:12 }}>🍶</div>
                <h2 style={{ fontSize:"1.4rem", fontWeight:"normal", color:"#e8e0d0", margin:"0 0 6px 0" }}>Quel ingrédient changer ?</h2>
                <p style={{ color:MUTED, fontSize:"0.82rem", fontStyle:"italic", margin:"0 0 24px 0" }}>Ingrédients du <span style={{ color:GOLD }}>{selectedClassique}</span></p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {(() => {
                    // Get ingredients from RECIPES first, then local allCocktails, then fetch from Claude
                    const localC = allCocktails().find(c=>c.classique===selectedClassique&&c.variation==="classique");
                    const recipeIngs = (RECIPES[selectedClassique]?.ingredients || RECIPES[localC?.name]?.ingredients || []).map(i=>i.name);
                    const localIngs = localC?.ingredients || [];
                    const ings = recipeIngs.length > 0 ? recipeIngs : localIngs;
                    return ings.length > 0 ? ings.map(ing => (
                      <button key={ing} className="opt" onClick={() => selectClassiqueIngredientToChange(ing)}
                        style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${FAINT}`, borderRadius:12, padding:"13px 16px", color:"#a09080", cursor:"pointer", fontSize:"0.9rem", textAlign:"left", fontFamily:"Georgia, serif", transition:"all 0.2s" }}>
                        {ing}
                      </button>
                    )) : (
                      <p style={{ color:MUTED, fontSize:"0.82rem", fontStyle:"italic", gridColumn:"1/-1" }}>
                        Consultez d'abord la recette classique pour voir ses ingrédients.
                      </p>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ── PATH: Ingredients — Step 0 ── */}
            {quizPath === "ingredients" && quizStep === 0 && (
              <div style={{ animation:"slideUp 0.3s ease" }}>
                <div style={{ fontSize:"1.8rem", marginBottom:12 }}>🍾</div>
                <h2 style={{ fontSize:"1.4rem", fontWeight:"normal", color:"#e8e0d0", margin:"0 0 6px 0" }}>Quels ingrédients vous tentent ?</h2>
                <p style={{ color:MUTED, fontSize:"0.82rem", fontStyle:"italic", margin:"0 0 4px 0" }}>Sélectionnez jusqu'à 5 ingrédients</p>
                {barIsEmpty() && <p style={{ color:"#4a3a2a", fontSize:"0.75rem", fontStyle:"italic", margin:"0 0 16px 0" }}>Complétez votre bar pour affiner cette liste</p>}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
                  {getBarDisplayList().map(item => {
                    const active = item.members.some(m => selectedIngredients.includes(m));
                    const maxed = selectedIngredients.length >= 5 && !active;
                    return (
                      <button key={item.label} onClick={() => {
                        if (maxed) return;
                        if (active) {
                          setSelectedIngredients(prev => prev.filter(s => !item.members.includes(s)));
                        } else {
                          setSelectedIngredients(prev => [...prev, item.members[0]]);
                        }
                      }}
                        style={{ background:active?"rgba(201,169,110,0.15)":"rgba(255,255,255,0.02)", border:`1px solid ${active?GOLD:FAINT}`, borderRadius:10, padding:"11px 14px", color:active?GOLD:maxed?"#3a2a2a":"#6a5a4a", cursor:maxed?"default":"pointer", fontSize:"0.82rem", textAlign:"left", fontFamily:"Georgia, serif", transition:"all 0.15s", display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:"0.7rem", opacity:active?1:0.3 }}>●</span>
                        <span>{item.emoji} {item.label}</span>
                      </button>
                    );
                  })}
                </div>
                <button onClick={searchByIngredients} disabled={selectedIngredients.length===0}
                  style={{ width:"100%", background:selectedIngredients.length>0?"rgba(201,169,110,0.1)":"rgba(255,255,255,0.02)", border:`1px solid ${selectedIngredients.length>0?GOLD:FAINT}`, borderRadius:12, padding:"14px", color:selectedIngredients.length>0?GOLD:MUTED, cursor:selectedIngredients.length>0?"pointer":"default", fontSize:"0.9rem", fontFamily:"Georgia, serif" }}>
                  {selectedIngredients.length===0 ? "Sélectionnez au moins un ingrédient" : `Trouver des cocktails (${selectedIngredients.length}/5) →`}
                </button>
              </div>
            )}

            {/* ── PATH: Name — Step 0 ── */}
            {quizPath === "name" && quizStep === 0 && (
              <div style={{ animation:"slideUp 0.3s ease" }}>
                <div style={{ fontSize:"1.8rem", marginBottom:12 }}>🔍</div>
                <h2 style={{ fontSize:"1.4rem", fontWeight:"normal", color:"#e8e0d0", margin:"0 0 6px 0" }}>Quel cocktail cherchez-vous ?</h2>
                <p style={{ color:MUTED, fontSize:"0.82rem", fontStyle:"italic", margin:"0 0 24px 0" }}>Base diffordsguide + vos cocktails personnels</p>
                <input value={nameSearch} onChange={e => { setNameSearch(e.target.value); setNameError(false); }}
                  onKeyDown={e => e.key==="Enter" && searchByName()}
                  placeholder="Ex : Negroni, Spritz, Last Word…"
                  style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,0.03)", border:nameError?"1px solid #c0392b":"1px solid "+FAINT, borderRadius:10, padding:"14px 16px", color:"#e8e0d0", fontSize:"0.95rem", fontFamily:"Georgia, serif", marginBottom:10 }} />
                {nameError && <div style={{ color:"#c0392b", fontSize:"0.82rem", marginBottom:12 }}>Cocktail introuvable sur Difford's Guide. Vérifiez l'orthographe ou essayez un autre nom.</div>}
                <button onClick={searchByName} disabled={nameLoading}
                  style={{ width:"100%", background:"rgba(201,169,110,0.1)", border:`1px solid ${GOLD}`, borderRadius:12, padding:"14px", color:GOLD, cursor:nameLoading?"default":"pointer", fontSize:"0.9rem", fontFamily:"Georgia, serif" }}>
                  {nameLoading ? "🔍 Recherche sur Difford's Guide…" : "Rechercher →"}
                </button>
              </div>
            )}

            {/* ── PATH: Favoris — Step 0 ── */}
            {quizPath === "favoris" && quizStep === 0 && (
              <div style={{ animation:"slideUp 0.3s ease" }}>
                <div style={{ fontSize:"1.8rem", marginBottom:12 }}>❤️</div>
                <h2 style={{ fontSize:"1.4rem", fontWeight:"normal", color:"#e8e0d0", margin:"0 0 6px 0" }}>Mes cocktails préférés</h2>
                <p style={{ color:MUTED, fontSize:"0.82rem", fontStyle:"italic", margin:"0 0 24px 0" }}>{currentLiked.length} favori{currentLiked.length!==1?"s":""}</p>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {currentLiked.map((item, idx) => {
                    // Handle both string format ("Name") and old object format ({name, emoji, date})
                    const name = typeof item === "string" ? item : item?.name;
                    if (!name) return null;
                    const c = allCocktails().find(c => c.name === name);
                    return (
                      <button key={name + idx} className="opt" onClick={() => selectFavorite(name)}
                        style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${FAINT}`, borderRadius:12, padding:"16px 18px", textAlign:"left", cursor:"pointer", display:"flex", alignItems:"center", gap:14, transition:"all 0.2s" }}>
                        <span style={{ fontSize:"1.4rem" }}>{c?.emoji || (typeof item === "object" ? item?.emoji : null) || "🍸"}</span>
                        <div>
                          <div style={{ color:"#e8e0d0", fontSize:"0.92rem" }}>{name}</div>
                          {c && <div style={{ color:MUTED, fontSize:"0.75rem", marginTop:2 }}>{c.description}</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Step 5: Proposals list ── */}
            {quizStep === 5 && (
              <div style={{ animation:"slideUp 0.3s ease" }}>
                <div style={{ marginBottom:28 }}>
                  <div style={{ fontSize:"1.5rem", marginBottom:8 }}>✨</div>
                  <h2 style={{ fontSize:"1.4rem", fontWeight:"normal", color:GOLD, margin:0 }}>Vos cocktails</h2>
                  {!loadingRecs && <p style={{ color:MUTED, fontSize:"0.82rem", marginTop:6, fontStyle:"italic" }}>
                    {proposals.pourVous.length} pour vous · {proposals.decouvertes.length} découverte{proposals.decouvertes.length!==1?"s":""}
                  </p>}
                </div>
                {loadingRecs ? (
                  <div style={{ textAlign:"center", padding:"60px 0" }}>
                    <div style={{ fontSize:"2.5rem", marginBottom:20, animation:"spin 1.5s linear infinite", display:"inline-block" }}>🍸</div>
                    <div style={{ color:MUTED, fontSize:"0.9rem", fontStyle:"italic" }}>Le mixologue consulte diffordsguide…</div>
                    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                  </div>
                ) : recsError ? (
                  <div style={{ textAlign:"center", padding:"40px 0" }}>
                    <div style={{ fontSize:"2rem", marginBottom:16 }}>😔</div>
                    <div style={{ color:MUTED, marginBottom:16 }}>Erreur de connexion. Réessayez.</div>
                    <button onClick={() => setQuizStep(quizStep - 1)} style={{ background:"rgba(201,169,110,0.1)", border:`1px solid ${GOLD}`, borderRadius:10, padding:"10px 20px", color:GOLD, cursor:"pointer", fontFamily:"Georgia, serif" }}>← Retour</button>
                  </div>
                ) : proposals.pourVous.length === 0 && proposals.decouvertes.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"40px 0" }}>
                    <div style={{ fontSize:"2rem", marginBottom:16 }}>🥲</div>
                    <div style={{ color:MUTED }}>Aucun cocktail trouvé.</div>
                  </div>
                ) : (
                  <ProposalsList
                    pourVous={proposals.pourVous}
                    decouvertes={proposals.decouvertes}
                    onSelect={selectCocktailFromList}
                  />
                )}
              </div>
            )}

            {/* ── Step 10: Recipe ── */}
            {quizStep === 10 && selectedCocktail && (
              <div style={{ animation:"slideUp 0.3s ease" }}>
                <RecipeCard
                  name={selectedCocktail.name}
                  localRecipe={getRecipe(selectedCocktail.name, customCocktails)}
                  onClose={() => setQuizStep(quizPath==="favoris"||quizPath==="name" ? 0 : 5)}
                  onFavorite={() => toggleLike(selectedCocktail.name)}
                  isFavorite={isLiked(selectedCocktail.name)}
                  onChangeIngredient={(recipeData) => initiateChangeIngredient(selectedCocktail, recipeData)}
                />
              </div>
            )}

            {/* ── Step 11: Change ingredient ── */}
            {quizStep === 11 && (
              <div style={{ animation:"slideUp 0.3s ease" }}>
                <div style={{ fontSize:"1.8rem", marginBottom:12 }}>🔄</div>
                <h2 style={{ fontSize:"1.4rem", fontWeight:"normal", color:"#e8e0d0", margin:"0 0 6px 0" }}>Quel ingrédient changer ?</h2>
                <p style={{ color:MUTED, fontSize:"0.82rem", fontStyle:"italic", margin:"0 0 24px 0" }}>Ingrédients de <span style={{ color:GOLD }}>{selectedCocktail?.name}</span></p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {changeIngList.map(ing => (
                    <button key={ing} className="opt" onClick={() => changeIngredient(ing)}
                      style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${FAINT}`, borderRadius:12, padding:"13px 16px", color:"#a09080", cursor:"pointer", fontSize:"0.9rem", textAlign:"left", fontFamily:"Georgia, serif", transition:"all 0.2s" }}>
                      {ing}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── BAR ── */}
        {screen === "bar" && (
          <div style={{ animation:"slideUp 0.4s ease", paddingTop:50, paddingBottom:60 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:40 }}>
              <button onClick={() => setScreen("home")} className="nav" style={navBtn}>← Accueil</button>
              <span style={{ color:GOLD, fontSize:"0.85rem" }}>Mon Bar</span>
            </div>
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:"1.8rem", marginBottom:8 }}>🍾</div>
              <h2 style={{ fontSize:"1.4rem", fontWeight:"normal", color:GOLD, margin:"0 0 4px 0" }}>Contenu de mon bar</h2>
              <p style={{ color:MUTED, fontSize:"0.82rem", fontStyle:"italic", margin:0 }}>Citrons, citrons verts et oranges toujours disponibles ✓</p>
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
              {Object.entries(CAT_LABELS).map(([cat, { label, emoji }]) => (
                <button key={cat} onClick={() => setOpenCat(cat)}
                  style={{ background:openCat===cat?"rgba(201,169,110,0.15)":"rgba(255,255,255,0.02)", border:`1px solid ${openCat===cat?GOLD:FAINT}`, borderRadius:20, padding:"8px 14px", color:openCat===cat?GOLD:"#a09080", cursor:"pointer", fontSize:"0.8rem", fontFamily:"Georgia, serif" }}>
                  {emoji} {label} ({(stock[openCat===cat?cat:cat]||[]).length})
                </button>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
              {openCat === "alcools" ? (
                // Show families — solo, accordion, or grouped
                [...BAR_FAMILIES, ...(stock.custom_alcools||[]).filter(c => !BAR_FAMILIES.flatMap(f=>f.members).includes(c)).map(c => ({ key:c, label:c, emoji:"✎", members:[c], solo:true }))].map(family => {
                  const active = family.members.some(m => (stock.alcools||[]).includes(m));
                  const isAccordion = !!family.accordion;
                  const isExpanded = !!expandedFamilies[family.key];

                  function toggleFamily() {
                    const updated = { ...stock };
                    if (active) {
                      updated.alcools = (updated.alcools||[]).filter(m => !family.members.includes(m));
                    } else {
                      const toAdd = family.members.filter(m => !(updated.alcools||[]).includes(m));
                      updated.alcools = [...(updated.alcools||[]), ...toAdd];
                    }
                    saveStock(updated);
                  }

                  function toggleMember(member) {
                    const updated = { ...stock };
                    if ((updated.alcools||[]).includes(member)) {
                      updated.alcools = updated.alcools.filter(m => m !== member);
                    } else {
                      updated.alcools = [...(updated.alcools||[]), member];
                    }
                    saveStock(updated);
                  }

                  if (isAccordion) {
                    return (
                      <div key={family.key} style={{ gridColumn:"span 2" }}>
                        <button onClick={() => setExpandedFamilies(prev => ({...prev, [family.key]: !prev[family.key]}))}
                          style={{ width:"100%", background:active?"rgba(201,169,110,0.12)":"rgba(255,255,255,0.02)", border:`1px solid ${active?GOLD:FAINT}`, borderRadius:10, padding:"12px 14px", color:active?GOLD:"#6a5a4a", cursor:"pointer", fontSize:"0.88rem", textAlign:"left", fontFamily:"Georgia, serif", display:"flex", alignItems:"center", gap:10 }}>
                          <span style={{ fontSize:"0.7rem", opacity:active?1:0.3 }}>●</span>
                          <span style={{ flex:1 }}>{family.emoji} {family.label}</span>
                          <span style={{ fontSize:"0.7rem", color:MUTED }}>{isExpanded?"▲":"▼"}</span>
                        </button>
                        {isExpanded && (
                          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginTop:6, paddingLeft:8 }}>
                            {family.members.map(member => {
                              const memberActive = (stock.alcools||[]).includes(member);
                              return (
                                <button key={member} onClick={() => toggleMember(member)}
                                  style={{ background:memberActive?"rgba(201,169,110,0.15)":"rgba(255,255,255,0.02)", border:`1px solid ${memberActive?GOLD:FAINT}`, borderRadius:8, padding:"9px 12px", color:memberActive?GOLD:"#5a4a3a", cursor:"pointer", fontSize:"0.78rem", textAlign:"left", fontFamily:"Georgia, serif", display:"flex", alignItems:"center", gap:6 }}>
                                  <span style={{ fontSize:"0.65rem", opacity:memberActive?1:0.3 }}>●</span>
                                  {member}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <button key={family.key} onClick={toggleFamily}
                      style={{ background:active?"rgba(201,169,110,0.12)":"rgba(255,255,255,0.02)", border:`1px solid ${active?GOLD:FAINT}`, borderRadius:10, padding:"12px 14px", color:active?GOLD:"#6a5a4a", cursor:"pointer", fontSize:"0.88rem", textAlign:"left", fontFamily:"Georgia, serif", transition:"all 0.15s", display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:"0.7rem", opacity:active?1:0.3 }}>●</span>
                      <span style={{ flex:1 }}>{family.emoji} {family.label}</span>
                    </button>
                  );
                })
              ) : (
                // Flat list for other categories
                [...BAR_INVENTORY[openCat], ...(stock[`custom_${openCat}`]||[]).filter(c => !BAR_INVENTORY[openCat].includes(c))].map(item => {
                  const active = (stock[openCat]||[]).includes(item);
                  return (
                    <button key={item} onClick={() => toggleIngredient(openCat, item)}
                      style={{ background:active?"rgba(201,169,110,0.12)":"rgba(255,255,255,0.02)", border:`1px solid ${active?GOLD:FAINT}`, borderRadius:10, padding:"10px 14px", color:active?GOLD:"#6a5a4a", cursor:"pointer", fontSize:"0.82rem", textAlign:"left", fontFamily:"Georgia, serif", transition:"all 0.15s", display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:"0.7rem", opacity:active?1:0.3 }}>●</span>
                      <span style={{ flex:1 }}>{item}</span>
                    </button>
                  );
                })
              )}
            </div>
            <IngredientSearch openCat={openCat} stock={stock} onAdd={name => addCustomIngredient(openCat, name)} />
            <div style={{ padding:"14px 18px", background:"rgba(201,169,110,0.04)", border:`1px solid ${FAINT}`, borderRadius:12, marginBottom:20 }}>
              <div style={{ fontSize:"0.78rem", color:MUTED, marginBottom:8 }}>Résumé</div>
              {Object.entries(CAT_LABELS).map(([cat, { label, emoji }]) => (
                <div key={cat} style={{ fontSize:"0.8rem", color:(stock[cat]||[]).length>0?"#a09080":"#3a2a1a", marginBottom:3 }}>
                  {emoji} {label}: {(stock[cat]||[]).length>0?(stock[cat]||[]).join(", "):"—"}
                </div>
              ))}
            </div>
            {/* Export/Import */}
            <div style={{ border:`1px solid ${FAINT}`, borderRadius:12, padding:"16px 18px" }}>
              <div style={{ fontSize:"0.78rem", color:MUTED, marginBottom:14 }}>💾 Sauvegarder / Restaurer</div>
              <button onClick={generateExportCode} style={{ width:"100%", background:"rgba(201,169,110,0.08)", border:`1px solid ${GOLD}`, borderRadius:10, padding:"12px", color:GOLD, cursor:"pointer", fontSize:"0.85rem", fontFamily:"Georgia, serif", marginBottom:10 }}>
                Exporter (copier le code)
              </button>
              {exportCode && (
                <div style={{ marginBottom:14 }}>
                  <div onClick={() => { navigator.clipboard?.writeText(exportCode); showNotif("✓ Code copié !"); }}
                    style={{ background:"rgba(0,0,0,0.3)", border:`1px solid #2a2535`, borderRadius:8, padding:"10px 12px", fontSize:"0.68rem", color:"#a09080", wordBreak:"break-all", cursor:"pointer", fontFamily:"monospace" }}>
                    {exportCode}
                  </div>
                  <div style={{ fontSize:"0.72rem", color:MUTED, marginTop:4, fontStyle:"italic" }}>Appuyez pour copier</div>
                </div>
              )}
              <div style={{ borderTop:`1px solid ${FAINT}`, paddingTop:14 }}>
                <textarea value={importInput} onChange={e => { setImportInput(e.target.value); setImportError(false); }} placeholder="Collez votre code ici…" rows={2}
                  style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,0.03)", border:importError?"1px solid #c0392b":"1px solid "+FAINT, borderRadius:8, padding:"10px 12px", color:"#e8e0d0", fontSize:"0.75rem", fontFamily:"monospace", resize:"none" }} />
                {importError && <div style={{ fontSize:"0.75rem", color:"#c0392b", marginBottom:6 }}>Code invalide.</div>}
                <button onClick={importFromCode} disabled={!importInput.trim()}
                  style={{ width:"100%", background:importInput.trim()?"rgba(201,169,110,0.1)":"rgba(255,255,255,0.02)", border:`1px solid ${importInput.trim()?GOLD:FAINT}`, borderRadius:10, padding:"11px", color:importInput.trim()?GOLD:MUTED, cursor:importInput.trim()?"pointer":"default", fontSize:"0.85rem", fontFamily:"Georgia, serif", marginTop:8 }}>
                  Restaurer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CREATION ── */}
        {screen === "creation" && (
          <div style={{ animation:"slideUp 0.4s ease", paddingTop:50, paddingBottom:40 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:36 }}>
              <button onClick={() => { setScreen("userMenu"); setCreatedRecipe(null); }} className="nav" style={navBtn}>← Retour</button>
              <span style={{ color:"#c0a0ff", fontSize:"0.85rem" }}>🧪 Création</span>
            </div>

            {!createdRecipe && !loadingCreation && (
              <div style={{ animation:"slideUp 0.3s ease" }}>
                <div style={{ fontSize:"1.8rem", marginBottom:12 }}>🧪</div>
                <h2 style={{ fontSize:"1.4rem", fontWeight:"normal", color:"#c0a0ff", margin:"0 0 6px 0" }}>Créer un cocktail</h2>
                <p style={{ color:MUTED, fontSize:"0.82rem", fontStyle:"italic", margin:"0 0 6px 0" }}>Choisissez vos ingrédients de base (1 à 5)</p>
                <p style={{ color:"#5a4a6a", fontSize:"0.78rem", margin:"0 0 24px 0" }}>Le mixologue peut en ajouter d'autres pour équilibrer</p>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
                  {(barIsEmpty()
                    ? ["Gin London Dry","Vodka","Rhum blanc","Bourbon","Tequila Blanco","Campari","Vermouth Rouge","Triple Sec","Amaretto","Kahlúa","Mezcal","Cognac VSOP","Pisco","Chartreuse Verte","Maraschino"]
                    : getBarIngredients()
                  ).map(ing => {
                    const active = creationIngredients.includes(ing);
                    const maxed = creationIngredients.length >= 5 && !active;
                    return (
                      <button key={ing} onClick={() => !maxed && toggleCreationIng(ing)}
                        style={{ background:active?"rgba(120,80,200,0.2)":"rgba(255,255,255,0.02)", border:active?"1px solid rgba(120,80,200,0.6)":"1px solid "+FAINT, borderRadius:10, padding:"11px 14px", color:active?"#c0a0ff":maxed?"#3a2a2a":"#6a5a4a", cursor:maxed?"default":"pointer", fontSize:"0.82rem", textAlign:"left", fontFamily:"Georgia, serif", transition:"all 0.15s", display:"flex", alignItems:"center", gap:8 }}>
                        <span style={{ fontSize:"0.7rem", opacity:active?1:0.3 }}>●</span>{ing}
                      </button>
                    );
                  })}
                </div>

                <button onClick={createCocktail} disabled={creationIngredients.length===0}
                  style={{ width:"100%", background:creationIngredients.length>0?"rgba(120,80,200,0.15)":"rgba(255,255,255,0.02)", border:creationIngredients.length>0?"1px solid rgba(120,80,200,0.5)":"1px solid "+FAINT, borderRadius:12, padding:"16px", color:creationIngredients.length>0?"#c0a0ff":MUTED, cursor:creationIngredients.length>0?"pointer":"default", fontSize:"0.9rem", fontFamily:"Georgia, serif" }}>
                  {creationIngredients.length===0 ? "Sélectionnez au moins un ingrédient" : "✨ Créer avec "+creationIngredients.join(", ")+" →"}
                </button>
              </div>
            )}

            {loadingCreation && (
              <div style={{ textAlign:"center", padding:"60px 0" }}>
                <div style={{ fontSize:"2.5rem", marginBottom:20, animation:"spin 1.5s linear infinite", display:"inline-block" }}>🧪</div>
                <div style={{ color:"#c0a0ff", fontSize:"0.9rem", fontStyle:"italic" }}>Le mixologue crée votre cocktail…</div>
                <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
              </div>
            )}

            {createdRecipe && !loadingCreation && (
              <div style={{ animation:"slideUp 0.3s ease" }}>
                {/* Header */}
                <div style={{ marginBottom:28, padding:"20px", background:"rgba(120,80,200,0.06)", border:"1px solid rgba(120,80,200,0.2)", borderRadius:14 }}>
                  <div style={{ fontSize:"0.72rem", color:"rgba(120,80,200,0.7)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>✨ Création originale du Mixologue</div>
                  <h2 style={{ fontSize:"1.6rem", fontWeight:"normal", color:"#c0a0ff", margin:"0 0 6px 0" }}>{createdRecipe.name}</h2>
                  {createdRecipe.tagline && <p style={{ color:MUTED, fontSize:"0.88rem", fontStyle:"italic", margin:0 }}>{createdRecipe.tagline}</p>}
                </div>

                {/* Badges */}
                <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
                  {createdRecipe.glass && <span style={{ fontSize:"0.78rem", color:MUTED, background:"rgba(255,255,255,0.03)", border:`1px solid ${FAINT}`, borderRadius:20, padding:"4px 12px" }}>🥃 {createdRecipe.glass}</span>}
                  {createdRecipe.method && <span style={{ fontSize:"0.78rem", color:MUTED, background:"rgba(255,255,255,0.03)", border:`1px solid ${FAINT}`, borderRadius:20, padding:"4px 12px" }}>⚗️ {createdRecipe.method}</span>}
                </div>

                {/* Ingredients */}
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:"0.75rem", color:MUTED, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:10 }}>Ingrédients</div>
                  {(createdRecipe.ingredients||[]).map((ing, i) => (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${FAINT}` }}>
                      <div>
                        <span style={{ color: creationIngredients.includes(ing.name) ? "#c0a0ff" : "#e8e0d0", fontSize:"0.9rem" }}>{ing.name}</span>
                        {creationIngredients.includes(ing.name) && <span style={{ fontSize:"0.68rem", color:"rgba(120,80,200,0.6)", marginLeft:6 }}>votre choix</span>}
                        {(createdRecipe.addedIngredients||[]).includes(ing.name) && <span style={{ fontSize:"0.68rem", color:MUTED, marginLeft:6 }}>ajouté par le mixologue</span>}
                        {ing.note && <div style={{ fontSize:"0.72rem", color:MUTED, fontStyle:"italic" }}>{ing.note}</div>}
                      </div>
                      <span style={{ color:GOLD, fontSize:"0.85rem" }}>{ing.amount}</span>
                    </div>
                  ))}
                </div>

                {/* Garnish */}
                {createdRecipe.garnish && <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:"0.75rem", color:MUTED, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>Garniture</div>
                  <div style={{ color:"#a09080", fontSize:"0.88rem" }}>{createdRecipe.garnish}</div>
                </div>}

                {/* Instructions */}
                {createdRecipe.instructions && <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:"0.75rem", color:MUTED, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>Préparation</div>
                  <div style={{ color:"#a09080", fontSize:"0.88rem", lineHeight:1.6 }}>{createdRecipe.instructions}</div>
                </div>}

                {/* Rationale */}
                {createdRecipe.rationale && <div style={{ marginBottom:24, padding:"14px 16px", background:"rgba(255,255,255,0.02)", border:`1px solid ${FAINT}`, borderRadius:10 }}>
                  <div style={{ fontSize:"0.72rem", color:MUTED, marginBottom:6 }}>💬 Note du mixologue</div>
                  <div style={{ color:"#6a5a7a", fontSize:"0.82rem", fontStyle:"italic", lineHeight:1.5 }}>{createdRecipe.rationale}</div>
                </div>}

                {/* Actions */}
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  <button onClick={saveCreatedCocktail}
                    style={{ width:"100%", background:"rgba(120,80,200,0.15)", border:"1px solid rgba(120,80,200,0.5)", borderRadius:12, padding:"14px", color:"#c0a0ff", cursor:"pointer", fontSize:"0.9rem", fontFamily:"Georgia, serif" }}>
                    ⭐ Ajouter à mes cocktails
                  </button>
                  <button onClick={() => { setCreatedRecipe(null); setCreationIngredients([]); }}
                    style={{ width:"100%", background:"rgba(255,255,255,0.02)", border:`1px solid ${FAINT}`, borderRadius:12, padding:"14px", color:MUTED, cursor:"pointer", fontSize:"0.9rem", fontFamily:"Georgia, serif" }}>
                    🔄 Créer une autre version
                  </button>
                  <button onClick={() => setScreen("userMenu")}
                    style={{ width:"100%", background:"transparent", border:"none", padding:"10px", color:MUTED, cursor:"pointer", fontSize:"0.85rem", fontFamily:"Georgia, serif" }}>
                    Retour au menu
                  </button>
                </div>
              </div>
            )}
          </div>
          )}

        {/* ── CATALOG ── */}
        {screen === "catalog" && (
          <div style={{ animation:"slideUp 0.4s ease", paddingTop:50, paddingBottom:60 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32 }}>
              <button onClick={() => { setScreen("home"); setCatalogSelected(null); }} className="nav" style={navBtn}>← Accueil</button>
              <span style={{ color:GOLD, fontSize:"0.85rem" }}>✦ Difford's Guide</span>
            </div>

            {!catalogSelected ? (
              <div>
                <div style={{ fontSize:"1.8rem", marginBottom:8 }}>✦</div>
                <h2 style={{ fontSize:"1.4rem", fontWeight:"normal", color:GOLD, margin:"0 0 4px 0" }}>Catalogue Difford's Guide</h2>
                <p style={{ color:MUTED, fontSize:"0.82rem", fontStyle:"italic", margin:"0 0 20px 0" }}>
                  {DIFFORD_HALL_OF_FAME.length + customCocktails.filter(c => c.fromSearch && !DIFFORD_HALL_OF_FAME.some(n => n.toLowerCase() === c.name.toLowerCase())).length} cocktails référencés
                </p>



                {/* Search */}
                <input value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)}
                  placeholder="Rechercher un cocktail…"
                  style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,0.03)", border:`1px solid ${FAINT}`, borderRadius:10, padding:"12px 16px", color:"#e8e0d0", fontSize:"0.9rem", fontFamily:"Georgia, serif", marginBottom:20 }} />

                {/* Family view with anchor navigation */}
                {(() => {
                  const searchAdded = customCocktails.filter(c => c.fromSearch);
                  const allEntries = [
                    ...DIFFORD_HALL_OF_FAME.map(name => ({ name, isSearchAdded: false })),
                    ...searchAdded.filter(c => !DIFFORD_HALL_OF_FAME.some(n => n.toLowerCase() === c.name.toLowerCase())).map(c => ({ name: c.name, isSearchAdded: true })),
                  ].filter(e => e.name.toLowerCase().includes(catalogSearch.toLowerCase()));

                  const grouped = {};
                  allEntries.forEach(e => {
                    const fam = getCocktailFamily(e.name);
                    if (!grouped[fam]) grouped[fam] = [];
                    grouped[fam].push(e);
                  });
                  const activeFamilies = FAMILY_ORDER.filter(f => grouped[f]?.length > 0);

                  const CocktailBtn = ({ name, isSearchAdded }) => (
                    <button onClick={() => setCatalogSelected(name)}
                      className="opt" style={{ width:"100%", background:isSearchAdded?"rgba(120,80,200,0.05)":"rgba(201,169,110,0.03)", border:isSearchAdded?"1px solid rgba(120,80,200,0.25)":"1px solid rgba(201,169,110,0.15)", borderRadius:10, padding:"11px 16px", textAlign:"left", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", transition:"all 0.15s", marginBottom:6 }}>
                      <div>
                        <span style={{ color:"#e8e0d0", fontSize:"0.88rem" }}>{name}</span>
                        {isSearchAdded && <div style={{ fontSize:"0.62rem", color:"rgba(120,80,200,0.7)", marginTop:1 }}>⭐ Ajouté par vous</div>}
                      </div>
                      <span style={{ color:MUTED, fontSize:"0.8rem" }}>→</span>
                    </button>
                  );

                  return (
                    <div>
                      {/* Anchor navigation */}
                      {!catalogSearch && (
                        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:28, padding:"14px 16px", background:"rgba(201,169,110,0.04)", border:`1px solid ${FAINT}`, borderRadius:12 }}>
                          {activeFamilies.map(fam => (
                            <button key={fam} onClick={() => {
                              const el = document.getElementById(`cat-${fam}`);
                              if (el) el.scrollIntoView({ behavior:"smooth", block:"start" });
                            }}
                              style={{ color:GOLD, fontSize:"0.78rem", background:"rgba(201,169,110,0.08)", border:`1px solid rgba(201,169,110,0.2)`, borderRadius:20, padding:"5px 12px", cursor:"pointer", fontFamily:"Georgia, serif" }}>
                              {fam} <span style={{ color:MUTED, fontSize:"0.68rem" }}>({grouped[fam].length})</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Grouped list */}
                      {activeFamilies.map(family => (
                        <div key={family} id={`cat-${family}`} style={{ marginBottom:28 }}>
                          <div style={{ fontSize:"0.72rem", color:GOLD, textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:12, display:"flex", alignItems:"center", gap:8, position:"sticky", top:0, background:"rgba(10,10,15,0.95)", padding:"8px 0", zIndex:10 }}>
                            <span>{family}</span>
                            <span style={{ color:MUTED }}>({grouped[family].length})</span>
                          </div>
                          {grouped[family].sort((a,b) => a.name.localeCompare(b.name)).map(e => <CocktailBtn key={e.name} {...e} />)}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div>
                <button onClick={() => setCatalogSelected(null)} className="nav" style={{ ...navBtn, marginBottom:28 }}>← Liste</button>
                {/* Show recipe for selected cocktail */}
                {(() => {
                  const localRecipe = RECIPES[catalogSelected] || null;
                  return (
                    <RecipeCard
                      name={catalogSelected}
                      localRecipe={localRecipe}
                      onClose={() => setCatalogSelected(null)}
                      onFavorite={() => currentUser && toggleLike(catalogSelected)}
                      isFavorite={currentUser ? isLiked(catalogSelected) : false}
                      onChangeIngredient={() => {}}
                    />
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── MY COCKTAILS ── */}
        {screen === "mycocktails" && (
          <div style={{ animation:"slideUp 0.4s ease", paddingTop:50, paddingBottom:40 }}>
            {viewingCustomRecipe ? (
              <div>
                <button onClick={() => setViewingCustomRecipe(null)} className="nav" style={{ ...navBtn, marginBottom:28 }}>← Mes Cocktails</button>
                <RecipeCard
                  name={viewingCustomRecipe.name}
                  localRecipe={viewingCustomRecipe.recipe || null}
                  onClose={() => setViewingCustomRecipe(null)}
                  onFavorite={() => currentUser && toggleLike(viewingCustomRecipe.name)}
                  isFavorite={currentUser ? isLiked(viewingCustomRecipe.name) : false}
                  onChangeIngredient={() => {}}
                />
              </div>
            ) : (
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:40 }}>
                  <button onClick={() => setScreen("home")} className="nav" style={navBtn}>← Accueil</button>
                  <span style={{ color:GOLD, fontSize:"0.85rem" }}>Mes Cocktails</span>
                </div>
                <div style={{ marginBottom:28 }}>
                  <div style={{ fontSize:"1.8rem", marginBottom:8 }}>📝</div>
                  <h2 style={{ fontSize:"1.4rem", fontWeight:"normal", color:GOLD, margin:0 }}>Mes cocktails personnels</h2>
                </div>
                {customCocktails.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"40px 20px", color:"#4a3a2a", fontStyle:"italic", marginBottom:32 }}>
                    Aucun cocktail personnel pour l'instant.
                  </div>
                ) : (
                  customCocktails.map((c, i) => (
                    <div key={c.name} style={{ border:`1px solid ${FAINT}`, borderRadius:12, padding:"16px 18px", marginBottom:10, display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }}
                      onClick={() => setViewingCustomRecipe(c)}>
                      <div style={{ display:"flex", alignItems:"center", gap:14, flex:1 }}>
                        <span style={{ fontSize:"1.4rem" }}>{c.emoji}</span>
                        <div>
                          <div style={{ color:"#e8e0d0", fontSize:"0.92rem" }}>{c.name}</div>
                          <div style={{ color:MUTED, fontSize:"0.75rem" }}>{c.description}</div>
                          {(() => {
                            const t = COCKTAIL_TAGS[c.name] || TAGS_CACHE[c.name] || [];
                            return t.length > 0 ? (
                              <div style={{ display:"flex", gap:4, marginTop:4, flexWrap:"wrap" }}>
                                {t.map(tag => (
                                  <span key={tag} style={{ fontSize:"0.65rem", color:"#c0a0ff", background:"rgba(120,80,200,0.1)", border:"1px solid rgba(120,80,200,0.2)", borderRadius:20, padding:"1px 7px" }}>{tag}</span>
                                ))}
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        <span style={{ color:MUTED, fontSize:"0.8rem" }}>→</span>
                        <button onClick={e => { e.stopPropagation(); const updated = customCocktails.filter((_,j)=>j!==i); saveCustom(updated); showNotif("Supprimé"); }}
                          style={{ background:"none", border:"none", color:"#3a2a2a", cursor:"pointer", fontSize:"1.1rem", padding:"4px 8px" }}>×</button>
                      </div>
                    </div>
                  ))
                )}
                <div style={{ border:`1px dashed ${FAINT}`, borderRadius:12, padding:"20px", marginTop:16 }}>
                  <div style={{ fontSize:"0.82rem", color:MUTED, marginBottom:16 }}>+ Ajouter un cocktail</div>
                  <input value={customForm.name} onChange={e => setCustomForm({...customForm, name:e.target.value})} placeholder="Nom du cocktail"
                    style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,0.03)", border:`1px solid ${FAINT}`, borderRadius:8, padding:"10px 14px", color:"#e8e0d0", fontSize:"0.88rem", fontFamily:"Georgia, serif", marginBottom:10 }} />
                  <input value={customForm.description} onChange={e => setCustomForm({...customForm, description:e.target.value})} placeholder="Description courte (ingrédients principaux)"
                    style={{ width:"100%", boxSizing:"border-box", background:"rgba(255,255,255,0.03)", border:`1px solid ${FAINT}`, borderRadius:8, padding:"10px 14px", color:"#e8e0d0", fontSize:"0.88rem", fontFamily:"Georgia, serif", marginBottom:10 }} />
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
                    {["🍸","🥃","🍹","🥂","🍊","🌿","☕","🍋","🌶️","✨"].map(e => (
                      <button key={e} onClick={() => setCustomForm({...customForm, emoji:e})}
                        style={{ background:customForm.emoji===e?"rgba(201,169,110,0.15)":"transparent", border:`1px solid ${customForm.emoji===e?GOLD:FAINT}`, borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:"1.2rem" }}>
                        {e}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => {
                    if (!customForm.name.trim()) { showNotif("Donnez un nom au cocktail !"); return; }
                    const newC = { name:customForm.name.trim(), description:customForm.description.trim(), emoji:customForm.emoji, ingredients:[], tags:["custom"], variation:"variation", classique:"Custom" };
                    saveCustom([...customCocktails, newC]);
                    setCustomForm({ name:"", description:"", emoji:"🍹", ingredients:[], tags:[], recipe:{ glass:"", method:"", garnish:"", instructions:"", ingredients:[] } });
                    showNotif(`✓ "${newC.name}" ajouté !`);
                  }} style={{ width:"100%", background:"rgba(201,169,110,0.1)", border:`1px solid ${GOLD}`, borderRadius:10, padding:"12px", color:GOLD, cursor:"pointer", fontSize:"0.88rem", fontFamily:"Georgia, serif" }}>
                    Ajouter ce cocktail
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}