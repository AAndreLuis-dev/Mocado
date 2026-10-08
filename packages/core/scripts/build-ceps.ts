import { writeFileSync } from 'node:fs';

const CIDADES: Record<string, string[]> = {
  AC: ['Rio Branco', 'Cruzeiro do Sul'],
  AL: ['Maceió', 'Arapiraca'],
  AP: ['Macapá', 'Santana'],
  AM: ['Manaus', 'Parintins'],
  BA: ['Salvador', 'Feira de Santana', 'Vitória da Conquista'],
  CE: ['Fortaleza', 'Juazeiro do Norte', 'Sobral'],
  DF: ['Brasília'],
  ES: ['Vitória', 'Vila Velha', 'Serra'],
  GO: ['Goiânia', 'Anápolis', 'Aparecida de Goiânia'],
  MA: ['São Luís', 'Imperatriz'],
  MT: ['Cuiabá', 'Várzea Grande', 'Rondonópolis'],
  MS: ['Campo Grande', 'Dourados'],
  MG: ['Belo Horizonte', 'Uberlândia', 'Juiz de Fora'],
  PA: ['Belém', 'Ananindeua', 'Santarém'],
  PB: ['João Pessoa', 'Campina Grande'],
  PR: ['Curitiba', 'Londrina', 'Maringá'],
  PE: ['Recife', 'Jaboatão dos Guararapes', 'Caruaru'],
  PI: ['Teresina', 'Parnaíba'],
  RJ: ['Rio de Janeiro', 'Niterói', 'Duque de Caxias'],
  RN: ['Natal', 'Mossoró'],
  RS: ['Porto Alegre', 'Caxias do Sul', 'Pelotas'],
  RO: ['Porto Velho', 'Ji-Paraná'],
  RR: ['Boa Vista'],
  SC: ['Florianópolis', 'Joinville', 'Blumenau'],
  SP: ['São Paulo', 'Campinas', 'Santos', 'Ribeirão Preto'],
  SE: ['Aracaju', 'Nossa Senhora do Socorro'],
  TO: ['Palmas', 'Araguaína'],
};
const TERMOS = ['Brasil', 'Santos', 'Sete', 'Paulo', 'Rio'];
const POR_CIDADE = 4;

interface ViaCep {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const out: { cep: string; logradouro: string; bairro: string; cidade: string; uf: string }[] = [];
for (const [uf, cidades] of Object.entries(CIDADES)) {
  for (const cidade of cidades) {
    const picked = new Map<string, ViaCep>();
    for (const termo of TERMOS) {
      if (picked.size >= POR_CIDADE) break;
      const url = `https://viacep.com.br/ws/${uf}/${encodeURIComponent(cidade)}/${termo}/json/`;
      const res = await fetch(url);
      const list = res.ok ? ((await res.json()) as ViaCep[]) : [];
      for (const e of Array.isArray(list) ? list : []) {
        if (picked.size >= POR_CIDADE) break;
        const special = Number(e.cep.slice(-3)) >= 900;
        if (e.logradouro && e.bairro && !special && !picked.has(e.bairro)) picked.set(e.bairro, e);
      }
      await sleep(300);
    }
    for (const e of picked.values())
      out.push({
        cep: e.cep,
        logradouro: e.logradouro,
        bairro: e.bairro,
        cidade: e.localidade,
        uf: e.uf,
      });
    console.log(uf, cidade, picked.size);
  }
}
out.sort((a, b) => a.cep.localeCompare(b.cep));
writeFileSync(
  new URL('../src/data/ceps.json', import.meta.url),
  '[\n' + out.map((e) => JSON.stringify(e)).join(',\n') + '\n]\n',
);
console.log('total', out.length);
