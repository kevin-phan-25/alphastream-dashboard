import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCredentialFile,validateCredentialDraft} from '../src/lib/coinbase-credentials.ts';
const key='-----BEGIN EC PRIVATE KEY-----\n'+'a'.repeat(200)+'\n-----END EC PRIVATE KEY-----';
test('Coinbase JSON imports only credential fields and preserves PEM newlines',()=>{
 assert.deepEqual(parseCredentialFile(JSON.stringify({name:'organizations/org/apiKeys/key',privateKey:key,extra:'ignore'})),{keyName:'organizations/org/apiKeys/key',privateKey:key});
 assert.deepEqual(parseCredentialFile(key),{privateKey:key});
});
test('Malformed or oversized uploads cannot replace credentials',()=>{
 for(const body of ['{}','null','[]','invalid','x'.repeat(16385)])assert.throws(()=>parseCredentialFile(body));
});
test('Portfolio discovery validates key first; saving requires a portfolio',()=>{
 const draft={keyName:'organizations/org/apiKeys/key',privateKey:key,portfolioId:''};
 assert.equal(validateCredentialDraft(draft,false),null);
 assert.match(validateCredentialDraft(draft),/portfolio/i);
 assert.equal(validateCredentialDraft({...draft,portfolioId:'11111111-1111-4111-8111-111111111111'}),null);
 assert.match(validateCredentialDraft({...draft,privateKey:'not a key'},false),/private key/i);
});
