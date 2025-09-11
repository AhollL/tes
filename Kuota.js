addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const html = `
  <!DOCTYPE html>
  <html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Cek Kuota XL & AXIS - Mediafairy</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <link href="https://my.kmsp-store.com/assets/build/toastr.css" rel="stylesheet" />
    <link rel="stylesheet" href="https://my.kmsp-store.com/assets/css/spinner.css" />
    <style>
      body {
        background: linear-gradient(to bottom, #0a0a0a, #1e3c72);
        font-family: 'Poppins', sans-serif;
        color: #fff;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 2rem;
        position: relative; /* Added for positioning the footer text */
        flex-direction: column; /* Added to stack elements vertically */
      }
      .card-glass {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 1rem;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
        padding: 2rem;
        width: 100%;
        max-width: 480px;
      }
      .form-control {
        background-color: rgba(255,255,255,0.15);
        border: 1px solid rgba(255,255,255,0.2);
        color: #fff;
      }
      .btn-primary {
        background-color: #00d2ff;
        border: none;
        font-weight: bold;
      }
      .alert {
        background-color: rgba(255,255,255,0.1);
        border: none;
        color: #fff;
      }
      .background-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-size: 100px; /* Ukuran default */
        opacity: 0.1; /* Opasitas untuk visibilitas */
        white-space: nowrap; /* Mencegah pembungkusan teks */
        pointer-events: none; /* Mencegah interaksi dengan teks */
      }

      @media (max-width: 768px) {
        .background-text {
          font-size: 60px; /* Ukuran untuk layar ponsel */
        }
      }

      @media (max-width: 480px) {
        .background-text {
          font-size: 40px; /* Ukuran lebih kecil untuk layar ponsel kecil */
        }
      }
      .footer-text {
        color: white;
        margin-top: 20px; /* Jarak atas untuk memisahkan dari konten lainnya */
        text-align: center; /* Pusatkan teks */
      }
    </style>
  </head>
  <body>
    <div id="cover-spin"></div>
    <div class="background-text">mediafairy</div>
    <div class="card-glass">
      <div class="text-center mb-4">
        <h3><i class="fa fa-signal"></i> Cek Kuota XL/AXIS</h3>
      </div>
      <div class="alert alert-info">
        <i class="fa fa-info-circle"></i> Gunakan layanan ini secara bijak. Hindari spam.
      </div>
      <form id="formnya">
        <div class="mb-3">
          <label for="msisdn" class="form-label">Nomor HP XL/AXIS:</label>
          <input type="number" class="form-control" id="msisdn" placeholder="Contoh: 08xxx / 628xxx" maxlength="16" required>
        </div>
        <button type="button" id="submitCekKuota" class="btn btn-primary w-100">
          <i class="fa fa-search"></i> Cek Sekarang
        </button>
        <div id="hasilnya" class="mt-3"></div>
      </form>
    </div>
    <div class="footer-text">dibuat dengan ♥️ @Mediafairy</div>
    <script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://my.kmsp-store.com/assets/toastr.js"></script>
    <script>
      function cekKuota() {
        const msisdn = $('#msisdn').val();
        if (!msisdn) {
          toastr.warning('Nomor tidak boleh kosong.');
          return;
        }
        $.ajax({
          type: 'GET',
          url: \`https://apigw.kmsp-store.com/sidompul/v4/cek_kuota?msisdn=\${msisdn}&isJSON=true\`,
          dataType: 'JSON',
          contentType: 'application/x-www-form-urlencoded',
          beforeSend: function (req) {
            req.setRequestHeader('Authorization', 'Basic c2lkb21wdWxhcGk6YXBpZ3drbXNw');
            req.setRequestHeader('X-API-Key', '60ef29aa-a648-4668-90ae-20951ef90c55');
            req.setRequestHeader('X-App-Version', '4.0.0');
            $('#cover-spin').show();
          },
          success: function (res) {
            $('#cover-spin').hide();
            $('#hasilnya').html('');
            if (res.status) {
              toastr.success(res.message);
              $('#hasilnya').html(\`<div class="alert alert-success">\${res.data.hasil}</div>\`);
            } else {
              toastr.error(res.message);
              $('#hasilnya').html(\`<div class="alert alert-danger">\${res.data.keteranganError}</div>\`);
            }
          },
          error: function () {
            $('#cover-spin').hide();
            toastr.error('Terjadi kesalahan, silakan coba kembali.');
          }
        });
      }
      $(document).ready(function () {
        $('#submitCekKuota').click(cekKuota);
        $('#msisdn').on('keypress', function (e) {
          if (e.which === 13) cekKuota();
        });
      });
    </script>
  </body>
  </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
