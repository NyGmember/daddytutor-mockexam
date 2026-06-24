/**
 * A lightweight, self-contained YAML parser for configuration frontmatter.
 */
export function parseYaml(yamlText) {
  const lines = yamlText.split('\n');
  const root = {};
  const path = []; // array of { indent, key, container }
  
  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const indent = line.length - line.trimStart().length;
    
    // Clean key and val
    const colonIdx = trimmed.indexOf(':');
    let key, val;
    if (colonIdx > -1) {
      key = trimmed.substring(0, colonIdx).trim();
      val = trimmed.substring(colonIdx + 1).trim();
    } else {
      key = trimmed;
      val = '';
    }
    
    // Check if it's a list item
    const isListItem = key.startsWith('-');
    if (isListItem) {
      key = key.substring(1).trim();
    }
    
    // Unquote key
    if (key.startsWith('"') && key.endsWith('"')) key = key.slice(1, -1);
    if (key.startsWith("'") && key.endsWith("'")) key = key.slice(1, -1);
    
    // Unquote val
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    if (val.startsWith('[') && val.endsWith(']')) {
      try {
        val = JSON.parse(val);
      } catch (e) {
        val = val.slice(1, -1).split(',').map(x => x.trim().replace(/^["']|["']$/g, ''));
      }
    }
    
    // Pop path until we find parent indent
    while (path.length > 0 && path[path.length - 1].indent >= indent) {
      path.pop();
    }
    
    const parentContainer = path.length > 0 ? path[path.length - 1].container : root;
    
    if (isListItem) {
      let currentItem;
      if (colonIdx > -1) {
        currentItem = {};
        currentItem[key] = val;
      } else {
        currentItem = key;
      }
      
      if (Array.isArray(parentContainer)) {
        parentContainer.push(currentItem);
        if (typeof currentItem === 'object') {
          path.push({ indent, key: null, container: currentItem });
        }
      } else {
        const lastPath = path[path.length - 1];
        if (lastPath && lastPath.key) {
          if (!Array.isArray(parentContainer[lastPath.key])) {
            parentContainer[lastPath.key] = [];
          }
          parentContainer[lastPath.key].push(currentItem);
          if (typeof currentItem === 'object') {
            path.push({ indent, key: null, container: currentItem });
          }
        }
      }
    } else {
      if (val === '') {
        const newContainer = {};
        parentContainer[key] = newContainer;
        path.push({ indent, key, container: newContainer });
      } else {
        parentContainer[key] = val;
        path.push({ indent, key, container: parentContainer });
      }
    }
  }
  
  return root;
}

/**
 * Converts a JS object to a simple flat YAML block (used for answer frontmatter).
 */
export function stringifyYaml(obj) {
  let yamlText = '';
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'object' && !Array.isArray(value)) {
      yamlText += `${key}:\n`;
      for (const [k, v] of Object.entries(value)) {
        yamlText += `  ${k}: "${v.toString().replace(/"/g, '\\"')}"\n`;
      }
    } else if (Array.isArray(value)) {
      yamlText += `${key}: ${JSON.stringify(value)}\n`;
    } else {
      if (typeof value === 'number') {
        yamlText += `${key}: ${value}\n`;
      } else {
        yamlText += `${key}: "${value.toString().replace(/"/g, '\\"')}"\n`;
      }
    }
  }
  return yamlText;
}
