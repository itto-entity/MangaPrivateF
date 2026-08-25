import { api } from "./api.js";

const OFFLINE_CACHE = "manga-offline-chapters-v1";

const params = new URLSearchParams(window.location.search);

const slug = params.get("slug");
const chapterId = params.get("chapter");

const title = document.querySelector("[data-reader-title]");
const pagesContainer = document.querySelector("[data-pages]");
const status = document.querySelector("[data-reader-status]");
const backLink = document.querySelector("[data-manga-back]");
const downloadButton = document.querySelector(
  "[data-download-chapter]"
);


/* =========================================================
    OFFLINE CACHE
   ========================================================= */

function offlinePageUrl(chapterId, pageNumber) {
  return new URL(
    `/__offline__/chapter/${encodeURIComponent(
      chapterId
    )}/page/${pageNumber}`,
    window.location.origin
  ).href;
}


async function isOfflinePageCached(
  chapterId,
  pageNumber
) {
  const cache = await caches.open(
    OFFLINE_CACHE
  );

  const cached = await cache.match(
    offlinePageUrl(
      chapterId,
      pageNumber
    )
  );

  return Boolean(cached);
}


/* =========================================================
    DOWNLOAD CHAPTER
   ========================================================= */

async function download_pages(pages) {
  if (!pages || !pages.length) {
    throw new Error("Chapter tidak memiliki halaman.");
  }

  downloadButton.disabled = true;

  try {
    const cache = await caches.open(
      "manga-offline-chapters-v1"
    );

    for (
      let index = 0;
      index < pages.length;
      index += 1
    ) {
      const page = pages[index];

      status.textContent =
        `Menyimpan halaman ${index + 1}/${pages.length}...`;

      const response = await fetch(
        page.signed_url,
        {
          mode: "no-cors",
        }
      );

      /*
       * Cross-origin Supabase signed URL
       * menghasilkan opaque response.
       *
       * Opaque response tidak bisa dibaca
       * oleh JavaScript, tetapi bisa disimpan
       * ke Cache Storage.
       */
      if (
        !response ||
        (
          response.type !== "opaque" &&
          !response.ok
        )
      ) {
        throw new Error(
          `Gagal mengunduh halaman ${page.page_number}.`
        );
      }

      /*
       * Jangan gunakan signed_url sebagai cache key.
       * Signed URL memiliki expiration.
       *
       * Gunakan URL internal yang stabil.
       */
      const cacheKey = offlinePageUrl(
        chapterId,
        page.page_number
      );

      await cache.put(
        cacheKey,
        response
      );
    }

    status.textContent =
      `Chapter tersimpan offline (${pages.length} halaman).`;

    downloadButton.textContent =
      "✓ Tersimpan Offline";

  } catch (error) {
    status.textContent =
      `Download gagal: ${error.message}`;

    status.classList.add("error");

  } finally {
    downloadButton.disabled = false;
  }
}

/* =========================================================
    IMAGE RENDERER
   ========================================================= */

function createPageImage(
  page,
  manga
) {

  const image =
    document.createElement("img");

  let retried = false;


  /*
   * Normal online source.
   */

  image.src =
    page.signed_url;


  image.alt =
    `${manga.title} — halaman ${page.page_number}`;


  image.loading =
    "lazy";


  image.addEventListener(
    "error",
    async () => {

      /*
       * Jangan retry tanpa batas.
       */

      if (retried) {

        image.alt =
          `Gambar halaman ${page.page_number} gagal dimuat`;

        status.textContent =
          `Gambar halaman ${page.page_number} gagal dimuat.`;

        status.classList.add(
          "error"
        );

        return;

      }


      retried = true;


      /*
       * =====================================================
       * 1. COBA OFFLINE CACHE
       * =====================================================
       */

      try {

        const cached =
          await isOfflinePageCached(
            chapterId,
            page.page_number
          );


        if (cached) {

          image.src =
            offlinePageUrl(
              chapterId,
              page.page_number
            );


          status.textContent =
            `Menggunakan cache offline untuk halaman ${page.page_number}...`;

          return;

        }

      } catch (error) {

        console.warn(
          "Offline cache check gagal:",
          error
        );

      }


      /*
       * =====================================================
       * 2. KALAU BELUM ADA CACHE
       *    REFRESH SIGNED URL
       * =====================================================
       */

      status.textContent =
        `Memperbarui akses gambar halaman ${page.page_number}...`;


      try {

        const response =
          await api.getChapterPages(
            chapterId
          );


        const refreshedPage =
          response.pages.find(
            (item) =>
              item.page_number ===
              page.page_number
          );


        if (!refreshedPage) {

          throw new Error(
            "Halaman tidak ditemukan."
          );

        }


        image.src =
          refreshedPage.signed_url;


      } catch (error) {

        console.error(
          "Refresh signed URL gagal:",
          error
        );


        image.alt =
          `Gambar halaman ${page.page_number} gagal dimuat`;


        status.textContent =
          `Akses gambar halaman ${page.page_number} kedaluwarsa atau tidak tersedia.`;


        status.classList.add(
          "error"
        );

      }

    }
  );


  return image;
}


/* =========================================================
   LOAD READER
   ========================================================= */

async function loadReader() {

  if (!slug) {

    showError(
      "Parameter slug wajib ada di URL."
    );

    return;

  }


  try {

    /*
     * Ambil metadata manga.
     */

    const manga =
      await api.getManga(slug);


    title.textContent =
      manga.title;


    backLink.href =
      `reader.html?slug=${encodeURIComponent(
        slug
      )}`;


    /*
     * =====================================================
     * MODE 1
     * BELUM MEMILIH CHAPTER
     * =====================================================
     */

    if (!chapterId) {

      /*
       * Tombol download tidak diperlukan
       * di daftar chapter.
       */

      if (downloadButton) {
        downloadButton.hidden =
          true;
      }


      const result =
        await api.getChapters(slug);


      const chapters =
        [...result.items].sort(
          (a, b) =>
            Number(
              b.chapter_number
            ) -
            Number(
              a.chapter_number
            )
        );


      if (!chapters.length) {

        status.textContent =
          "Belum ada chapter yang dipublikasikan.";

        return;

      }


      pagesContainer.classList.add(
        "chapter-list"
      );


      pagesContainer.replaceChildren(
        ...chapters.map(
          (chapter) => {

            const link =
              document.createElement(
                "a"
              );


            link.href =
              `reader.html?slug=${encodeURIComponent(
                slug
              )}&chapter=${encodeURIComponent(
                chapter.id
              )}`;


            link.textContent =
              `Chapter ${chapter.chapter_number}` +
              `${
                chapter.title
                  ? ` — ${chapter.title}`
                  : ""
              }`;


            return link;

          }
        )
      );


      status.textContent =
        "Pilih chapter untuk mulai membaca.";


      return;

    }


    /*
     * =====================================================
     * MODE 2
     * MEMBACA CHAPTER
     * =====================================================
     */

    const chapterPages =
      await api.getChapterPages(
        chapterId
      );


    const pages =
      [...chapterPages.pages].sort(
        (a, b) =>
          a.page_number -
          b.page_number
      );


    /*
     * Tampilkan tombol download.
     */

    if (downloadButton) {

      downloadButton.hidden =
        false;


      downloadButton.disabled =
        false;


      downloadButton.textContent =
        "📥 Download Chapter";


      /*
       * onclick assignment mencegah
       * event listener menumpuk.
       */

      downloadButton.onclick =
        () => download_pages(pages);

    }


    /*
     * Render semua halaman.
     */

    pagesContainer.replaceChildren(
      ...pages.map(
        (page) =>
          createPageImage(
            page,
            manga
          )
      )
    );


    status.textContent =
      `${pages.length} halaman`;


  } catch (error) {

    showError(
      error.message
    );

  }

}


/* =========================================================
    ERROR HANDLER
   ========================================================= */

function showError(message) {

  status.textContent =
    message;

  status.classList.add(
    "error"
  );

}


/* =========================================================
    START
   ========================================================= */

loadReader();