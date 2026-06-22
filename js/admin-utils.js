(function () {
  'use strict';

  var BUCKET = 'site-content';

  function guessContentType(file) {
    if (file.type) return file.type;
    var ext = (file.name.split('.').pop() || '').toLowerCase();
    var map = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif'
    };
    return map[ext] || 'application/octet-stream';
  }

  function storageErrorMessage(error) {
    if (!error) return 'שגיאה בהעלאת התמונה';
    return error.message || error.error_description || 'שגיאה בהעלאת התמונה';
  }

  function $(id) {
    return document.getElementById(id);
  }

  function showAlert(message, type, targetId) {
    var el = $(targetId || 'pageAlert');
    if (!el) return;
    el.hidden = false;
    el.textContent = message;
    el.className = 'admin-alert admin-alert--' + (type || 'error');
  }

  function hideAlert(targetId) {
    var el = $(targetId || 'pageAlert');
    if (!el) return;
    el.hidden = true;
    el.textContent = '';
  }

  function openModal(modalId) {
    var modal = $(modalId);
    if (!modal) return;
    modal.hidden = false;
    document.body.classList.add('admin-modal-open');
  }

  function closeModal(modalId, onClose) {
    var modal = $(modalId);
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('admin-modal-open');
    if (typeof onClose === 'function') onClose();
  }

  function setPreview(previewId, url) {
    var preview = $(previewId);
    if (!preview) return;
    if (!url) {
      preview.hidden = true;
      preview.removeAttribute('src');
      return;
    }
    preview.src = url;
    preview.hidden = false;
  }

  async function uploadImage(file, bucket, folder) {
    if (!file) throw new Error('לא נבחר קובץ תמונה');
    var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    var path = (folder ? folder + '/' : '') + crypto.randomUUID() + '.' + ext;
    var sb = EgozAdminAuth.getClient();
    var upload = await sb.storage.from(bucket || BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: guessContentType(file)
    });
    if (upload.error) throw new Error(storageErrorMessage(upload.error));
    var publicUrl = sb.storage.from(bucket || BUCKET).getPublicUrl(path);
    return publicUrl.data.publicUrl;
  }

  function bindModalClose(options) {
    options = options || {};
    var modalId = options.modalId || 'itemModal';
    var backdropId = options.backdropId || 'modalBackdrop';
    var closeBtnId = options.closeBtnId || 'closeModalBtn';
    var cancelBtnId = options.cancelBtnId || 'cancelEditBtn';
    var onClose = options.onClose;

    function close() {
      closeModal(modalId, onClose);
    }

    if ($(closeBtnId)) $(closeBtnId).addEventListener('click', close);
    if ($(cancelBtnId)) $(cancelBtnId).addEventListener('click', close);
    if ($(backdropId)) $(backdropId).addEventListener('click', close);

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && $(modalId) && !$(modalId).hidden) close();
    });
  }

  function bindImageInput(inputId, previewId, onFile) {
    var input = $(inputId);
    if (!input) return;
    input.addEventListener('change', function (event) {
      var file = event.target.files && event.target.files[0];
      if (typeof onFile === 'function') onFile(file || null);
      if (!file) {
        setPreview(previewId, '');
        return;
      }
      setPreview(previewId, URL.createObjectURL(file));
    });
  }

  function getSelectedImageFile(inputId, pendingFile) {
    var input = $(inputId);
    var fromInput = input && input.files && input.files[0];
    return fromInput || pendingFile || null;
  }

  function updateCount(elId, shown, total, labels) {
    var el = $(elId);
    if (!el) return;
    labels = labels || {};
    if (total === 0) {
      el.textContent = labels.empty || 'אין פריטים';
      return;
    }
    if (shown === total) {
      el.textContent = total === 1 ? (labels.one || 'פריט אחד') : total + ' ' + (labels.many || 'פריטים');
      return;
    }
    el.textContent = 'מציג ' + shown + ' מתוך ' + total + ' ' + (labels.many || 'פריטים');
  }

  window.EgozAdminUtils = {
    BUCKET: BUCKET,
    $: $,
    showAlert: showAlert,
    hideAlert: hideAlert,
    openModal: openModal,
    closeModal: closeModal,
    setPreview: setPreview,
    uploadImage: uploadImage,
    bindModalClose: bindModalClose,
    bindImageInput: bindImageInput,
    getSelectedImageFile: getSelectedImageFile,
    updateCount: updateCount
  };
})();
