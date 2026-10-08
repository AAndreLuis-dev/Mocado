// Form rendered only after a click (like a modal in a SPA).
document.getElementById('novo')!.addEventListener('click', () => {
  setTimeout(() => {
    document.getElementById('slot')!.innerHTML = `
      <div class="modal" role="dialog" aria-label="Novo cliente">
        <label>Nome completo <input name="cliente_nome"></label>
        <label>CPF <input name="cliente_cpf"></label>
        <label>E-mail <input name="cliente_email" type="email"></label>
        <label>Celular <input name="cliente_celular" type="tel"></label>
      </div>`;
  }, 300);
});

customElements.define(
  'mocado-email',
  class extends HTMLElement {
    connectedCallback() {
      this.attachShadow({ mode: 'open' }).innerHTML =
        `<label>E-mail (shadow) <input name="shadow_email" type="email"></label>`;
    }
  },
);
