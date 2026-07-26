import fs from 'fs';
const code = fs.readFileSync('temp.js', 'utf8');
const script = `
global.window = global;
global.document = { querySelectorAll: () => [], getElementById: () => ({ style: {}, classList: { remove: ()=>{}, add: ()=>{} }, value: '' }) };
global.localStorage = { getItem: () => null, setItem: () => null };
const ALGERIA_PROMPTS = {};
const initializeApp = () => ({});
const getFirestore = () => ({});
const getAuth = () => ({});
const onAuthStateChanged = () => {};
const doc = () => {};
const getDoc = () => {};
const supabase = { auth: { getSession: async () => ({data:{}}), onAuthStateChange: () => ({data:{subscription:{}}}) } };
` + code.replace(/import\s+[^;]+;/g, '');
try {
  eval(script);
  console.log("No runtime error up to initialization!");
} catch (e) {
  console.log("Runtime error!", e);
}
