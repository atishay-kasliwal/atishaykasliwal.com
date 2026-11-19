// A small JSON Schema checker: the draft 2020-12 subset src/profile/profile.schema.json uses, so
// no validator dependency is needed. No Node imports, so the admin response inspector can run it in
// the browser; scripts/lib/profile-checks.mjs re-exports it for the build checks and tests.
export function validateSchema(schema, value) {
  const errors = [];
  const resolve = ref => ref.replace(/^#\//, "").split("/").reduce((node, key) => node[key], schema);
  const typeOf = v => (v === null ? "null" : Array.isArray(v) ? "array" : Number.isInteger(v) ? "integer" : typeof v);
  const matchesType = (v, type) => [].concat(type).some(t => t === typeOf(v) || (t === "number" && typeof v === "number"));
  function check(node, v, at) {
    if (node.$ref) check(resolve(node.$ref), v, at);
    for (const sub of node.allOf ?? []) check(sub, v, at);
    if (node.oneOf) {
      const passing = node.oneOf.filter(sub => {
        const before = errors.length;
        check(sub, v, at);
        const ok = errors.length === before;
        errors.length = before;
        return ok;
      });
      if (passing.length !== 1) errors.push(`${at}: matches ${passing.length} oneOf branches`);
    }
    if (node.type && !matchesType(v, node.type)) return errors.push(`${at}: expected ${node.type}, got ${typeOf(v)}`);
    if ("const" in node && JSON.stringify(v) !== JSON.stringify(node.const)) errors.push(`${at}: expected ${JSON.stringify(node.const)}`);
    if (node.enum && !node.enum.includes(v)) errors.push(`${at}: ${JSON.stringify(v)} not in ${node.enum.join(", ")}`);
    if (node.pattern && typeof v === "string" && !new RegExp(node.pattern).test(v)) errors.push(`${at}: "${v}" does not match ${node.pattern}`);
    if (typeOf(v) === "object") {
      for (const key of node.required ?? []) if (!(key in v)) errors.push(`${at}: missing ${key}`);
      for (const [key, child] of Object.entries(v)) {
        if (node.properties?.[key]) check(node.properties[key], child, `${at}.${key}`);
        else if (node.additionalProperties === false) errors.push(`${at}: unexpected property ${key}`);
        else if (typeof node.additionalProperties === "object") check(node.additionalProperties, child, `${at}.${key}`);
      }
    }
    if (typeOf(v) === "array") {
      if (node.minItems && v.length < node.minItems) errors.push(`${at}: fewer than ${node.minItems} items`);
      if (node.items) v.forEach((item, i) => check(node.items, item, `${at}[${i}]`));
    }
  }
  check(schema, value, "$");
  return errors;
}
