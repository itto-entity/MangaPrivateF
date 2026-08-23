import { api, clearSession, getCurrentUser, setSession } from "./api.js";

export function updateAuthNavigation() {
  const user = getCurrentUser();
  const status = document.querySelector("[data-auth-status]");
  const logoutButton = document.querySelector("[data-logout]");
  const loginButton = document.querySelector("[data-login-btn]");
  if (status) status.textContent = user ? `Masuk sebagai ${user.profile?.username || user.username || user.email}` : "Belum masuk";
  if (logoutButton) logoutButton.hidden = !user;
  if (loginButton) loginButton.hidden = !!user;
}

export function bindLogout() {
  document.querySelector("[data-logout]")?.addEventListener("click", () => {
    clearSession();
    window.location.href = "index.html";
  });
}

export function bindLoginForm() {
  const form = document.querySelector("[data-login-form]");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector("button[type=submit]");
    const message = form.querySelector("[data-form-message]");
    submit.disabled = true;
    message.textContent = "Memproses login...";
    try {
      const session = await api.login(Object.fromEntries(new FormData(form)));
      setSession(session);
      window.location.href = "index.html";
    } catch (error) {
      message.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });
}
