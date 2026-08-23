import { api } from "./api.js";

const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");
const chapterId = params.get("chapter");
const title = document.querySelector("[data-reader-title]");
const pagesContainer = document.querySelector("[data-pages]");
const status = document.querySelector("[data-reader-status]");
const backLink = document.querySelector("[data-manga-back]");

function showError(message) {
  status.textContent = message;
  status.classList.add("error");
}

function createPageImage(page, manga) {
  const image = document.createElement("img");
  let retried = false;

  image.src = page.signed_url;
  image.alt = `${manga.title} — halaman ${page.page_number}`;
  image.loading = "lazy";
  image.addEventListener("error", async () => {
    if (retried) {
      image.alt = `Gambar halaman ${page.page_number} gagal dimuat`;
      status.textContent = `Gambar halaman ${page.page_number} gagal dimuat. Coba muat ulang halaman.`;
      status.classList.add("error");
      return;
    }

    retried = true;
    status.textContent = `Memperbarui akses gambar halaman ${page.page_number}...`;
    try {
      const response = await api.getChapterPages(chapterId);
      const refreshedPage = response.pages.find((item) => item.page_number === page.page_number);
      if (!refreshedPage) throw new Error("Halaman tidak ditemukan.");
      image.src = refreshedPage.signed_url;
    } catch {
      image.alt = `Gambar halaman ${page.page_number} gagal dimuat`;
      status.textContent = `Akses gambar halaman ${page.page_number} kedaluwarsa atau tidak tersedia.`;
      status.classList.add("error");
    }
  });
  return image;
}

async function loadReader() {
  if (!slug) return showError("Parameter slug wajib ada di URL.");
  try {
    const manga = await api.getManga(slug);
    title.textContent = manga.title;
    backLink.href = `reader.html?slug=${encodeURIComponent(slug)}`;
    if (!chapterId) {
      const result = await api.getChapters(slug);
      const chapters = [...result.items].sort((a, b) => Number(b.chapter_number) - Number(a.chapter_number));
      if (!chapters.length) {
        status.textContent = "Belum ada chapter yang dipublikasikan.";
        return;
      }
      pagesContainer.classList.add("chapter-list");
      pagesContainer.replaceChildren(...chapters.map((chapter) => {
        const link = document.createElement("a");
        link.href = `reader.html?slug=${encodeURIComponent(slug)}&chapter=${encodeURIComponent(chapter.id)}`;
        link.textContent = `Chapter ${chapter.chapter_number}${chapter.title ? ` — ${chapter.title}` : ""}`;
        return link;
      }));
      status.textContent = "Pilih chapter untuk mulai membaca.";
      return;
    }
    const chapterPages = await api.getChapterPages(chapterId);
    const pages = [...chapterPages.pages].sort((a, b) => a.page_number - b.page_number);
    pagesContainer.replaceChildren(...pages.map((page) => createPageImage(page, manga)));
    status.textContent = `${pages.length} halaman`;
  } catch (error) {
    showError(error.message);
  }
}

loadReader();
