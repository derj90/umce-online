#!/usr/bin/env node
/**
 * generate-keys.js — Generacion de keypair Ed25519 para Open Badges 3.0
 * Ejecutar UNA VEZ durante el setup inicial del proyecto.
 *
 * Uso:
 *   cd src && node generate-keys.js
 *
 * Genera:
 *   - Par de claves Ed25519 en formato multibase (z...)
 *   - Imprime instrucciones para agregar al .env
 *   - Imprime el DID document para servir en /.well-known/did.json
 */

const BASE_URL = process.env.BASE_URL || 'https://umce.online';
const DID = `did:web:${BASE_URL.replace('https://', '').replace('http://', '')}`;

async function main() {
  // Importacion dinamica de modulos ESM desde CJS
  const { generate } = await import('@digitalcredentials/ed25519-multikey');

  console.log('\n=== Generador de claves Ed25519 para Open Badges 3.0 ===\n');
  console.log(`DID: ${DID}`);
  console.log('Generando par de claves...\n');

  const keyPair = await generate({
    controller: DID,
  });

  const publicKeyMultibase = keyPair.publicKeyMultibase;
  const secretKeyMultibase = keyPair.secretKeyMultibase;
  const keyId = `${DID}#${publicKeyMultibase}`;

  // DID Document para /.well-known/did.json
  const didDocument = {
    '@context': [
      'https://www.w3.org/ns/did/v1',
      'https://w3id.org/security/multikey/v1'
    ],
    id: DID,
    verificationMethod: [
      {
        id: keyId,
        type: 'Multikey',
        controller: DID,
        publicKeyMultibase
      }
    ],
    assertionMethod: [keyId],
    authentication: [keyId]
  };

  console.log('=== AGREGAR AL .env ===');
  console.log('');
  console.log(`BADGE_PRIVATE_KEY=${secretKeyMultibase}`);
  console.log(`BADGE_PUBLIC_KEY=${publicKeyMultibase}`);
  console.log(`BADGE_KEY_ID=${keyId}`);
  console.log('');
  console.log('=== DID DOCUMENT (/.well-known/did.json) ===');
  console.log('Este contenido sera servido automaticamente por el servidor.');
  console.log('Guardalo tambien en src/public/.well-known/did.json como backup:');
  console.log('');
  console.log(JSON.stringify(didDocument, null, 2));
  console.log('');
  console.log('=== INSTRUCCIONES ===');
  console.log('1. Copia las 3 lineas de .env y pegalaas en tu archivo .env');
  console.log('2. Reinicia el servidor: node server.js');
  console.log('3. Verifica: curl https://umce.online/.well-known/did.json');
  console.log('');
  console.log('NOTA: La clave privada (BADGE_PRIVATE_KEY) es secreta.');
  console.log('      Nunca la compartas ni la subas a git.');
  console.log('');
}

main().catch(err => {
  console.error('Error generando claves:', err);
  process.exit(1);
});
