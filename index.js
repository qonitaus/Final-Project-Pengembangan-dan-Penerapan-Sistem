const express = require('express')
// const db = require('./config/connection')
const bodyParser = require('body-parser')
const app = express()
const multer = require('multer');
const xlsx = require('xlsx');
const port = 3000


const mysql = require('mysql')

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'soalujian',
    multipleStatements: true
})

module.exports = db

// set body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set("view engine", "ejs");

//Materi Postman
//menambah materi
app.post('/datatopik', (req, res) => {
    const { nama_materi } = req.body
    const sql = `INSERT INTO materi (id_materi, nama_materi) VALUES (NULL, '${nama_materi}')`
    db.query(sql, (error, result) => {
        //res.redirect('/soal')
        res.send({msg:'Materi berhasil ditambahkan'})
    })
})

//menampilkan materi
app.get('/datatopik', (req,res) => {
    // const{ nama_materi } = req.body
    const sql = 'SELECT id_materi, nama_materi FROM materi'
    db.query(sql, (error,result) => {
        //res.redirect('/soal')
        res.send({materi:result})
    })
})

//mengubah materi
app.put('/datatopik/:id_materi', (req, res) => {
    const id_materi = req.params.id_materi;
    const { nama_materi } = req.body;
    
    const sql = `UPDATE materi SET nama_materi='${nama_materi}' WHERE id_materi = ${id_materi}`;
    
    db.query(sql, (error, result) => {
        if (error) {
            res.status(500).send({ error: "Gagal mengedit data" });
        } else {
            res.send({ msg: 'Materi berhasil diubah' });
        }
    })
})

//menghapus materi
app.delete('/datatopik/:id_materi', (req, res) => {
    const id_materi = req.params.id_materi
    const sql = `DELETE FROM materi WHERE id_materi = ${id_materi}`
    db.query(sql, (error, result) => {
        res.send({msg: 'Materi berhasil dihapus!'})
    })
})

//soal Postman
//menampilkan soal
app.get('/datasoal', (req, res) => {
    const sql1 = `SELECT id_materi, nama_materi FROM materi`
    const sql2 = `SELECT soal_draft.id_soal_draft, materi.nama_materi,  soal_draft.tingkat_kesulitan, soal_draft.pertanyaan, soal_draft.pilihan_a,  soal_draft.pilihan_b,  soal_draft.pilihan_c,  soal_draft.pilihan_d,  soal_draft.pilihan_benar FROM soal_draft INNER JOIN materi ON soal_draft.id_materi=materi.id_materi`
    db.query(sql1, (error, result1) => {
        db.query(sql2, (error, result2) => {
        //    res.render('soal', {materi:result1, soal_draft:result2})
           res.send({materi:result1, soal_draft:result2})
        })
    })
})

//UPLOAD FILE
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//Upload FIle Postman
app.post('/datauploadbanksoal', upload.single('bankSoalFile'), async (req, res) => {
    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });

        const bankSoalSheet = workbook.Sheets[workbook.SheetNames[0]];
        // const bankJawabanSheet = workbook.Sheets[workbook.SheetNames[1]];

        const soal_draft = xlsx.utils.sheet_to_json(bankSoalSheet);
        // const dataJawaban = xlsx.utils.sheet_to_json(bankJawabanSheet);

        for (const row of soal_draft) {
            const { id_materi, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, pilihan_benar, tingkat_kesulitan } = row;

            // Check for undefined values and set them to null
            const id_materiValue = id_materi || null;
            const pertanyaanValue = pertanyaan || null;
            const pilihan_aValue = pilihan_a || null;
            const pilihan_bValue = pilihan_b || null;
            const pilihan_cValue = pilihan_c || null;
            const pilihan_dValue = pilihan_d || null;
            const pilihan_benarValue = pilihan_benar || null;
            const tingkatKesulitanValue = tingkat_kesulitan || null;

            const sql = `INSERT INTO soal_draft (id_materi, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, pilihan_benar, tingkat_kesulitan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            const values = [id_materiValue, pertanyaanValue, pilihan_aValue, pilihan_bValue, pilihan_cValue, pilihan_dValue, pilihan_benarValue, tingkatKesulitanValue];

            await db.query(sql, values);
        }

        res.send('Bank soal data successfully uploaded and imported into the database.');

        // db.end(); // No need to end the connection here if you plan to reuse it.
    } catch (error) {
        console.error('Error uploading and importing data:', error);
        res.status(500).send('An error occurred while uploading and importing data.');
    }
});

//menambah soal
app.post('/datasoal', (req, res) => {
    const { pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, pilihan_benar, id_materi, tingkat_kesulitan } = req.body
    const sql = `INSERT INTO soal_draft (id_soal_draft, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, pilihan_benar, id_materi, tingkat_kesulitan) VALUES (NULL, '${pertanyaan}', '${pilihan_a}', '${pilihan_b}', '${pilihan_c}', '${pilihan_d}', ${pilihan_benar}, ${id_materi}, ${tingkat_kesulitan})`
    db.query(sql, (error, result) => {
        res.send({msg :'Soal tersimpan'})
    })
    
})

//mengubah soal
app.put('/datasoal/:id_soal_draft', (req, res) => {
    const id_soal_draft = req.params.id_soal_draft;
    const { id_materi, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, pilihan_benar, tingkat_kesulitan } = req.body;

    const sql = `UPDATE soal_draft SET 
                  id_materi = COALESCE(?, id_materi),
                  pertanyaan = COALESCE(?, pertanyaan),
                  pilihan_a = COALESCE(?, pilihan_a),
                  pilihan_b = COALESCE(?, pilihan_b),
                  pilihan_c = COALESCE(?, pilihan_c),
                  pilihan_d = COALESCE(?, pilihan_d),
                  pilihan_benar = COALESCE(?, pilihan_benar),
                  tingkat_kesulitan = COALESCE(?, tingkat_kesulitan)
                WHERE id_soal_draft = ?`;

    db.query(sql, [id_materi, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, pilihan_benar, tingkat_kesulitan, id_soal_draft], (error, result) => {
        if (error) {
            res.status(500).send({ error: "Gagal mengedit data" });
        } else {
            res.send({ msg: 'Soal berhasil diubah' });
        }
    });
});

//menghapus soal
app.delete('/datasoal/:id_soal_draft', (req, res) => {
    const id_soal_draft = req.params.id_soal_draft
    const sql = `DELETE FROM soal_draft WHERE id_soal_draft = ${id_soal_draft}`
    db.query(sql, (error, result) => {
        // res.redirect('/soal')
        res.send({msg: 'Soal berhasil dihapus!'})
    })
})

//menampilkan soal per id
app.get('/datasoal/:id_soal_draft', (req, res) => {
    const id_soal_draft = req.params.id_soal_draft
    const sql = `SELECT * FROM soal_draft WHERE id_soal_draft = ${id_soal_draft}`
    db.query(sql, (error, result) => {
        res.send({soal_draft:result})
    })
})


// paket soal Postman
//menambah paket soal (kode_paketsoal nanti null krn belum di acak)
app.post('/datapaketsoal', (req, res) => {
    const { judul, jumlah_soal } = req.body
    const sql = `INSERT INTO paket_soal (id_paket_soal, judul, kode_paket, jumlah_soal) VALUES (NULL, '${judul}', NULL, '${jumlah_soal}')`
    db.query(sql, (error, result) => {
        // res.redirect('/soal')
        res.send({msg :'Paket Soal berhasil dibuat'})
    })
})

//menampilkan paket soal 
app.get('/datapaketsoal', (req, res) => {
    const sql = `SELECT id_paket_soal, judul, kode_paket, jumlah_soal FROM paket_soal`
    db.query(sql, (error, result) => {
        res.send({paketsoal:result})
    })
})

//menampilkan paket soal per id
app.get('/datapaketsoal/:id_paket_soal', (req, res) => {
    const id_paket_soal = req.params.id_paket_soal
    const sqlPaketSoal = `SELECT * FROM paket_soal WHERE id_paket_soal = ${id_paket_soal}`
    // const sqlSoalUjian = `SELECT soal_draft.pertanyaan, soal_draft.pilihan_a, soal_draft.pilihan_b, soal_draft.pilihan_c, soal_draft.pilihan_d FROM testpaketsoal INNER JOIN soal_draft ON testpaketsoal.id_soal_draft=soal_draft.id_soal_draft WHERE testpaketsoal.id_paket_soal = ${id_paket_soal}`
    const sqlSoalUjian = `SELECT soal_draft.pertanyaan, soal_draft.pilihan_a, soal_draft.pilihan_b, soal_draft.pilihan_c, soal_draft.pilihan_d FROM soal_ujian INNER JOIN soal_draft ON soal_ujian.id_soal_draft=soal_draft.id_soal_draft WHERE soal_ujian.id_paket_soal = ${id_paket_soal}`
    db.query(sqlPaketSoal, (error, result1) => {
        if (result1.length) {
            db.query(sqlSoalUjian, (error, result2) => {
                res.send({paket_soal:result1[0], soal_ujian:result2})
            })
        }
    })
})

//mengubah paket soal
app.put('/datapaketsoal/:id_paket_soal', (req, res) => {
    const id_paket_soal = req.params.id_paket_soal;
    const { judul, kode_paket, jumlah_soal } = req.body;

    const sql = `UPDATE paket_soal SET 
                  judul = COALESCE(?, judul),
                  kode_paket = COALESCE(?, kode_paket),
                  jumlah_soal = COALESCE(?, jumlah_soal)
                WHERE id_paket_soal = ?`;

    db.query(sql, [judul, kode_paket, jumlah_soal, id_paket_soal], (error, result) => {
        if (error) {
            res.status(500).send({ error: 'Gagal mengubah data' });
        } else {
            res.send({ msg: 'Paket Soal berhasil diubah' });
        }
    });
});

//menghapus paket soal
app.delete('/datapaketsoal/:id_paket_soal', (req, res) => {
    const id_paket_soal = req.params.id_paket_soal
    const sql = `DELETE FROM paket_soal WHERE id_paket_soal = ${id_paket_soal}`
    db.query(sql, (error, result) => {
        // res.redirect('/soal')
        res.send({msg :'Paket Soal berhasil dihapus'})
    })
})

//konfigurasi paket soal ujian postman
//menambah konfigurasi paket soal ujian
app.post('/datakonfigurasi', (req, res) => {
    const { id_paket_soal, id_materi, persentase_materi, persentase_mudah, persentase_sedang, persentase_sulit } = req.body
    const sql1 = `INSERT INTO konfigurasi_ujian (id_konfigurasiujian, id_paket_soal, id_materi, persentase_materi, persentase_mudah, persentase_sedang, persentase_sulit) VALUES (NULL, '${id_paket_soal}', '${id_materi}', '${persentase_materi}', '${persentase_mudah}', '${persentase_sedang}', '${persentase_sulit}')`
    const sql2 = `SELECT id_konfigurasiujian FROM konfigurasi_ujian ORDER BY id_exam DESC LIMIT 1`
    db.query(sql1, (error, result1) => {
        db.query(sql2, (error, result2) => {
            res.send({ msg: 'Konfigurasi berhasil dibuat' })
        })
    })
})

//menampilkan konfigurasi paket soal ujian
app.get('/datakonfigurasi', (req, res) => {
    const sql1 = 'SELECT id_paket_soal, judul, kode_paket, jumlah_soal FROM paket_soal'
    const sql2 = `SELECT konfigurasi_ujian.id_konfigurasiujian, materi.nama_materi, konfigurasi_ujian.persentase_materi, konfigurasi_ujian.persentase_mudah, konfigurasi_ujian.id_konfigurasiujiansedang, konfigurasi_ujian.persentase_sulit FROM konfigurasi_ujian INNER JOIN materi ON konfigurasi_ujian.id_materi=materi.id_materi`
    db.query(sql1, (error, result1) => {
        if (result1.length) {
            db.query(sql2, (error, result2) => {
                res.send({paket_soal:result1, konfigurasi_ujian:result2})
            })
        }
    })
})

//menampilkan konfigurasi paket soal ujian per id 
app.get('/datakonfigurasi/:id_paket_soal', (req, res) => {
    const id_paket_soal = req.params.id_paket_soal
    const sqlPaketSoal = `SELECT * FROM paket_soal WHERE id_paket_soal = ${id_paket_soal}`
    const sqlTopikUjian = `SELECT konfigurasi_ujian.id_konfigurasiujian, materi.nama_materi, konfigurasi_ujian.persentase_materi, konfigurasi_ujian.persentase_mudah, konfigurasi_ujian.persentase_sedang, konfigurasi_ujian.persentase_sulit FROM konfigurasi_ujian INNER JOIN materi ON konfigurasi_ujian.id_materi=materi.id_materi WHERE konfigurasi_ujian.id_paket_soal = ${id_paket_soal}`
    db.query(sqlPaketSoal, (error, result1) => {
        if (result1.length) {
            db.query(sqlTopikUjian, (error, result2) => {
                res.send({paket_soal:result1[0], konfigurasi_ujian:result2})
            })
        }
    })
})

//menghapus konfigurasi paket soal ujian
app.delete('/datakonfigurasi/:id_konfigurasiujian', (req, res) => {
    const id_konfigurasiujian = req.params.id_konfigurasiujian
    const sql = `DELETE FROM konfigurasi_ujian WHERE id_konfigurasiujian = ${id_konfigurasiujian}`
    db.query(sql, (error, result) => {
        res.send({msg :'Konfigurasi berhasil dihapus'})
    })
})

//Melakukan pengacakan soal ujian berdasarkan konfigurasi yang sudah ditetapkan per paket soal
//post paketsoal (untuk melakukan generate paket soal beserta pengacakan soal) > nanti otomatis kode paket soal juga akan ter generate
app.post('/datapaketsoal/:id_paket_soal', (req, res) => {
    const id_paket_soal = req.params.id_paket_soal

    // Cek konfigurasi paket soal
    async function checkConfig(id_paket_soal) {
        try {
            const sqlCheckConfig = `SELECT ROUND(SUM(persentase_materi), 2) AS 'total' FROM konfigurasi_ujian WHERE id_paket_soal = ?`
            const result = await new Promise((resolve, reject) => {
                db.query(sqlCheckConfig, [ id_paket_soal ], (error, result) => {
                    if (error) reject(error)
                    else resolve(result)
                })
            })
            return result[0].total
        } catch (error) {
            return res.status(500).json({ message: 'Ada kesalahan!' })
        }
    }
    
    // Hitung soal yang diperlukan
    async function getNumofSoal(id_paket_soal) {
        try {
            const sqlPaketsoal = `SELECT jumlah_soal FROM paket_soal WHERE id_paket_soal = ?`
            const jumlah_soal = await new Promise((resolve, reject) => {
                db.query(sqlPaketsoal, [ id_paket_soal ], (error, result) => {
                    if (error) reject(error)
                    else resolve(result[0].jumlah_soal)
                })
            })
            const sqlTopikujian = `SELECT id_materi, ROUND((persentase_mudah * persentase_materi * ${ jumlah_soal }), 0) AS 'soal_mudah', ROUND((persentase_sedang * persentase_materi * ${ jumlah_soal }), 0) AS 'soal_sedang', ROUND((persentase_sulit * persentase_materi * ${ jumlah_soal }), 0) AS 'soal_sulit' FROM konfigurasi_ujian WHERE id_paket_soal = ?`
            const requiredSoal = await new Promise((resolve, reject) => {
                db.query(sqlTopikujian, [ id_paket_soal ], (error, result) => {
                    if (error) reject(error)
                    else resolve(result)
                })
            })
            return requiredSoal
        } catch (error) {
            return res.status(500).json({ message: 'Gagal menghitung jumlah soal yang diperlukan!'})
        }
    }

    // Periksa ketersediaan soal
    async function checkSoal(requiredSoal) {
        try {
            const statuses = await Promise.all(requiredSoal.map(async (result) => {
                let idmateri = result.id_materi
                let soalRequired = [result.soal_mudah, result.soal_sedang, result.soal_sulit]
                for (let i = 0; i < 3; i++) {
                    let sqlCekSoal = `SELECT COUNT(id_materi) AS 'jumlah' FROM soal_draft WHERE id_materi = ${ idmateri } AND tingkat_kesulitan = ${ i+1 }`
                    let soaltersedia = await new Promise((resolve, reject) => {
                        db.query(sqlCekSoal, (error, result) => {
                            if (error) reject(error)
                            else resolve(result[0].jumlah)
                        })
                    })
                    if (soaltersedia < soalRequired[i]) { return 'tidak tesedia' }
                }
                return 'tersedia'
            }))
            return statuses.includes('tidak tesedia') ? 'tidak tesedia' : 'tersedia'
        } catch (error) {
            return res.status(500).json({ message: 'Gagal memeriksa ketersediaan soal!' })
        }
    }

    // Generate soal random
    async function getRandomSoal(requiredSoal) {
        try {
            const draft = await Promise.all(requiredSoal.map(async (result) => {
                let idmateri = result.id_materi
                let soalRequired = [result.soal_mudah, result.soal_sedang, result.soal_sulit]
                let soals = await Promise.all(soalRequired.map(async (required, j) => {
                    let sqlSoalUjian = `SELECT id_soal_draft FROM soal_draft WHERE id_materi = ${ idmateri } AND tingkat_kesulitan = ${ j+1 } ORDER BY RAND() LIMIT ${ required }`
                    let random = await new Promise((resolve, reject) => {
                        db.query(sqlSoalUjian, (error, result) => {
                            if (error) reject(error)
                            else resolve(result)
                        })
                    })
                    return random
                }))
                return [].concat(...soals)
                // return [].concat(...soal_drafts)
            }))
            return [].concat(...draft)
        } catch (error) {
            return res.status(500).json({ message: 'Gagal menghasilkan random soal' })
        }
    }

    // Jalankan fungsi
    async function runFunction(id) {
        try {
            const totalPersenTopik = await checkConfig(id)
            if (totalPersenTopik == 1.00) {
                const requiredSoal = await getNumofSoal(id)
                let status = await checkSoal(requiredSoal)
                if (status == 'tersedia') {
                    let draft = await getRandomSoal(requiredSoal)
                    // return res.status(200).json({ draft })
                    
                    // Menyimpan draft paket soal
                    let json = JSON.stringify(draft)
                    const dataArray = JSON.parse(json)
                    const values = dataArray.map(function(item) {
                        return `(NULL, ${ id }, ` + item.id_soal_draft + ")"
                    }).join(", ")

                    // const sqlInsert = "INSERT INTO testpaketsoal (id_preview, id_paket_soal, id_soal_draft) VALUES " + values
                    // const sqlSearch = `SELECT * FROM testpaketsoal WHERE id_paket_soal = ?`
                    // const sqlDelete = `DELETE FROM testpaketsoal WHERE id_paket_soal = ?`
                    // const sqlkode = `UPDATE paket_soal SET kode_paket = ROUND(RAND()*(999999-100000)+100000, 0) WHERE id_paket_soal = ?`
                    const sqlInsert = "INSERT INTO soal_ujian (id_soal_ujian, id_paket_soal, id_soal_draft) VALUES " + values
                    const sqlSearch = `SELECT * FROM soal_ujian WHERE id_paket_soal = ?`
                    const sqlDelete = `DELETE FROM soal_ujian WHERE id_paket_soal = ?`
                    const sqlkode = `UPDATE paket_soal SET kode_paket = ROUND(RAND()*(999999-100000)+100000, 0) WHERE id_paket_soal = ?`
                    db.query(sqlSearch, [ id_paket_soal ], (error, result) => {
                        if (error) {
                            return res.status(500).json({ message: 'Ada kesalahan!' })
                        }
                        
                        if (result.length) {
                            db.query(sqlDelete, [ id_paket_soal ], (error, result) => {
                                if (error) {
                                    return res.status(500).json({ message: 'Soal ujian tidak berhasil dihapus!' })
                                }
                                db.query(sqlInsert, (error, result) => {
                                    if (error) {
                                        return res.status(500).json({ message: 'Paket soal tidak berhasil dibuat1!' })
                                    } else {
                                        db.query(sqlkode, [ id_paket_soal ], (error, result) => {
                                            if (error) {
                                                return res.status(500).json({ message: 'Ada kesalahan!' })
                                            } else {
                                                return res.status(200).json({ message: 'Paket soal berhasil dibuat!' })
                                            }
                                        })
                                    }
                                })
                            })
                        } else {
                            db.query(sqlInsert, (error, result) => {
                                if (error) {
                                    return res.status(500).json({ message: 'Paket soal tidak berhasil dibuat2!' })
                                } else {
                                    db.query(sqlkode, [ id_paket_soal ], (error, result) => {
                                        if (error) {
                                            return res.status(500).json({ message: 'Ada kesalahan!' })
                                        } else {
                                            return res.status(200).json({ message: 'Paket soal berhasil dibuat!' })
                                        }
                                    })
                                }
                            })
                        }
                    })
                } else {
                    return res.status(500).json({ message: 'Soal yang tersedia tidak cukup!' })
                }
            } else {
                return res.status(500).json({ message: "Jumlah persentase topik harus tepat sama dengan 1 !" })
            }
        } catch (error) {
            return res.status(500).json({ message: 'Error' })
        }
    }

    runFunction(id_paket_soal)
})

//memanggil ejs halaman 'soal' untuk menampilkan bank soal
app.get('/soal', (req, res) => {
    const sql1 = `SELECT id_materi, nama_materi FROM materi`
    const sql2 = `SELECT soal_draft.id_soal_draft, materi.nama_materi,  soal_draft.tingkat_kesulitan, soal_draft.pertanyaan, soal_draft.pilihan_a,  soal_draft.pilihan_b,  soal_draft.pilihan_c,  soal_draft.pilihan_d,  soal_draft.pilihan_benar FROM soal_draft INNER JOIN materi ON soal_draft.id_materi=materi.id_materi`
    db.query(sql1, (error, result1) => {
        db.query(sql2, (error, result2) => {
        //    res.render('soal', {materi:result1, soal_draft:result2})
           res.render('soal', {materi:result1, soal_draft:result2})
        })
    })
})

//memanggil EJS halaman 'uploadsoal' untuk menampilkan halaman upload soal untuk melakukan upload soal
app.get('/soal/upload', (req, res) => {
    res.render('uploadsoal'); // Rendering EJS template
  });

//memanggil ejs halaman 'tambahsoal' untuk menampilkan halaman tambah soal
app.get('/soal/tambah', (req, res) => {
    const sql = `SELECT id_materi, nama_materi FROM materi`
    db.query(sql, (error, result) => {
        res.render('tambahsoal', { materi:result })
    })
})

//memanggil ejs halaman 'editsoal' untuk melakukan proses perubahan soal
app.get('/soal/ubah/:id_soal_draft', (req, res) => {
    const id_soal_draft = req.params.id_soal_draft
    const sql1 = `SELECT id_materi, nama_materi FROM materi`
    const sql2 = `SELECT soal_draft.id_soal_draft, materi.nama_materi,  soal_draft.tingkat_kesulitan, soal_draft.pertanyaan, soal_draft.pilihan_a,  soal_draft.pilihan_b,  soal_draft.pilihan_c,  soal_draft.pilihan_d,  soal_draft.pilihan_benar FROM soal_draft INNER JOIN materi ON soal_draft.id_materi=materi.id_materi WHERE id_soal_draft = ${id_soal_draft}`
    //     db.query(sql, (error, result) => {`
    db.query(sql1, (error, result1) => {
        db.query(sql2, (error, result2) => {
        //    res.render('soal', {materi:result1, soal_draft:result2})
           res.render('editsoal', {materi:result1, soal_draft:result2[0]})
    })
})
})

//memanggil ejs halaman 'paketsoal'
app.get('/paketsoal', (req, res) => {
    const sql = `SELECT id_paket_soal, judul, kode_paket, jumlah_soal FROM paket_soal`
    db.query(sql, (error, result) => {
        res.render('paketsoal', {paketsoal:result})
    })
})

//memanggil ejs halaman 'detailpaketsoal' untuk menampilkan soal pada paket soal ujian (yang sudah diacak)
app.get('/konfigurasi/:id_paket_soal', (req, res) => {
    const id_paket_soal = req.params.id_paket_soal
    const sql1 = `SELECT id_paket_soal, judul, kode_paket FROM paket_soal WHERE id_paket_soal=${id_paket_soal}`
    const sql2 = `SELECT soal_draft.pertanyaan, soal_draft.pilihan_a, soal_draft.pilihan_b, soal_draft.pilihan_c, soal_draft.pilihan_d FROM soal_ujian INNER JOIN soal_draft ON soal_ujian.id_soal_draft = soal_draft.id_soal_draft WHERE soal_ujian.id_paket_soal = ${id_paket_soal}`
    db.query(sql1, (error, result1) => {
       db.query(sql2, (error, result2) => {
            res.render('detailpaketsoal', {paketsoal:result1[0], soal_draft:result2})
        })
    })
})

//memanggil ejs halaman 'konfigurasi'
app.get('/konfigurasi', (req, res) => {
    const sql = 'SELECT id_paket_soal, judul FROM paket_soal'
    db.query(sql, (error, result) => {
        res.render('konfigurasi', {paket_soal:result})
    })
})

//memanggil ejs halaman 'editkonfigurasi'
app.get('/editkonfigurasi/:id_paket_soal', (req, res) => {
    const id_paket_soal = req.params.id_paket_soal
    const sqlPaketSoal = `SELECT * FROM paket_soal WHERE id_paket_soal = ${id_paket_soal}`
    const sqlmateri = `SELECT id_materi, nama_materi FROM materi`
    const sqlTopikUjian = `SELECT konfigurasi_ujian.id_konfigurasiujian, materi.nama_materi, konfigurasi_ujian.persentase_materi, konfigurasi_ujian.persentase_mudah, konfigurasi_ujian.persentase_sedang, konfigurasi_ujian.persentase_sulit FROM konfigurasi_ujian INNER JOIN materi ON konfigurasi_ujian.id_materi=materi.id_materi WHERE konfigurasi_ujian.id_paket_soal=${id_paket_soal}`
    db.query(sqlPaketSoal, (error, result1) => {
    if (result1.length) {
        db.query(sqlTopikUjian, (error, result2) => {
            db.query(sqlmateri, (error, result3) => {
            // res.send({konfigurasi_ujian:result2})
            //res.render('editkonfigurasi', {paket_soal:result1[0], materi:result2, konfigurasi_ujian:result3})
            res.render('editkonfigurasi', {paket_soal:result1[0], konfigurasi_ujian:result2, materi:result3})
            })
        })
     }
    })
})

//menambah materi pada website (manggil method)
app.post('/topik/simpan', (req, res) => {
    const { nama_materi } = req.body
    const sql = `INSERT INTO materi (id_materi, nama_materi) VALUES (NULL, '${nama_materi}')`
    db.query(sql, (error, result) => {
        //res.redirect('/soal')
        res.redirect('/soal')
    })
})

//menambah soal pada website (manggil method)
app.post('/datasoal/simpan', (req, res) => {
    const { pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, pilihan_benar, id_materi, tingkat_kesulitan } = req.body
    const sql = `INSERT INTO soal_draft (id_soal_draft, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, pilihan_benar, id_materi, tingkat_kesulitan) VALUES (NULL, '${pertanyaan}', '${pilihan_a}', '${pilihan_b}', '${pilihan_c}', '${pilihan_d}', ${pilihan_benar}, ${id_materi}, ${tingkat_kesulitan})`
    db.query(sql, (error, result) => {
        // res.send({msg :'Soal tersimpan'})
        res.redirect('/soal')
    })
    
})

//mengubah soal pada website (manggil method)
app.put('/datasoal/ubah/:id_soal_draft', (req, res) => {
    const id_soal_draft = req.params.id_soal_draft;
    const { id_materi, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, pilihan_benar, tingkat_kesulitan } = req.body;

    const sql = `UPDATE soal_draft SET 
                  id_materi = COALESCE(?, id_materi),
                  pertanyaan = COALESCE(?, pertanyaan),
                  pilihan_a = COALESCE(?, pilihan_a),
                  pilihan_b = COALESCE(?, pilihan_b),
                  pilihan_c = COALESCE(?, pilihan_c),
                  pilihan_d = COALESCE(?, pilihan_d),
                  pilihan_benar = COALESCE(?, pilihan_benar),
                  tingkat_kesulitan = COALESCE(?, tingkat_kesulitan)
                WHERE id_soal_draft = ?`;

    db.query(sql, [id_materi, pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, pilihan_benar, tingkat_kesulitan, id_soal_draft], (error, result) => {
        if (error) {
            res.status(500).send({ error: "Gagal mengedit data" });
        } else {
            res.redirect('/soal');
        }
    });
});

//menghapus soal pada website (manggil method)
app.get('/datasoal/hapus/:id_soal_draft', (req, res) => {
    const id_soal_draft = req.params.id_soal_draft
    const sql1 = `SELECT id_soal_draft FROM soal_draft WHERE id_soal_draft = ${id_soal_draft}`
    const sql2 = `DELETE FROM soal_draft WHERE id_soal_draft = ${id_soal_draft}`
    db.query(sql1, (error, result1) => {
        db.query(sql2, (error, result2) => {})
        res.redirect(`/soal`)
    })
})

//menambah paket soal pada website (manggil method)
app.post('/paketsoal/simpan', (req, res) => {
    const { judul, jumlah_soal } = req.body
    const sql1 = `INSERT INTO paket_soal (id_paket_soal, judul, jumlah_soal) VALUES (NULL, '${judul}', ${jumlah_soal})`
    const sql2 = `SELECT id_paket_soal FROM paket_soal ORDER BY id_paket_soal DESC LIMIT 1`
    db.query(sql1, (error, result1) => {
        db.query(sql2, (error, result2) => {
            res.redirect(`/konfigurasi/${result2[0].id_paket_soal}`)
        })
    })
})

// Post/ubah paketsoal sebelum nyimpen konfigurasi paket soal ujian fix pada website (manggil method)
app.post('/datapaketsoal/ubah/:id_paket_soal', (req, res) => {
    const id_paket_soal = req.params.id_paket_soal
    const { judul, jumlah_soal } = req.body
    const sql = `UPDATE exam SET judul='${judul}', jumlah_soal=${jumlah_soal} WHERE id_paket_soal = ${id_paket_soal}`
    db.query(sql, (error, result) => {
        res.redirect(`/konfigurasi/${id_paket_soal}`)
    })
})

//menyimpan/menambah konfigurasi paket soal ujian (fix jadi paketujian) pada website (manggil method)
app.post('/paketujian/simpan', (req,res) => {
        const { id_paket_soal, id_materi, persentase_materi, persentase_mudah, persentase_sedang, persentase_sulit } = req.body
        if (parseFloat(persentase_mudah) + parseFloat(persentase_sedang) + parseFloat(persentase_sulit) == 1.0) {
            const sql1 = `SELECT EXISTS (SELECT id_konfigurasiujian FROM konfigurasi_ujian WHERE id_paket_soal = ${id_paket_soal} AND id_materi = ${id_materi}) AS isExists`
            db.query(sql1, (error, result1) => {
                if (result1[0].isExists == 0) {
                    const sql2 = `INSERT INTO konfigurasi_ujian (id_konfigurasiujian, id_paket_soal, id_materi, persentase_materi, persentase_mudah, persentase_sedang, persentase_sulit) VALUES (NULL, ${id_paket_soal}, ${id_materi}, ${persentase_materi}, ${persentase_mudah}, ${persentase_sedang}, ${persentase_sulit})`
                    db.query(sql2, (error, result2) => {})
                }
            })
        }
        res.redirect(`/editkonfigurasi/${id_paket_soal}`, ) //masuk ke detail ujian (detail paketsoal = detail paket ujian)
    })

//menghapus konfigurasi paket soal ujian pada website (manggil method)
app.delete('/topikujian/hapus/:id_konfigurasiujian', (req, res) => {
    const id_konfigurasiujian = req.params.id_konfigurasiujian
    const sql1 = `SELECT id_paket_soal FROM konfigurasi_ujian WHERE id_konfigurasiujian = ${id_konfigurasiujian}`
    const sql2 = `DELETE FROM konfigurasi_ujian WHERE id_konfigurasiujian = ${id_konfigurasiujian}`
    db.query(sql1, (error, result1) => {
        db.query(sql2, (error, result2) => {})
         res.redirect('/paketsoal')
     })
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })

  //Command
  //   app.get('/konfigurasi/:id', (req, res) => {
//     const id = req.params.id
//     const sql1 = `SELECT id_exam, judul_exam, jumlah_soal FROM exam WHERE id_exam = ${id}`
//     const sql2 = `SELECT id_materi, nama_materi FROM materi`
//     const sql3 = `SELECT konfigurasi_ujian.id_konfigurasiujian, materi.nama_materi, konfigurasi_ujian.persentase_materi, konfigurasi_ujian.persentase_mudah, konfigurasi_ujian.persentase_sedang, konfigurasi_ujian.persentase_sulit FROM konfigurasi_ujian INNER JOIN materi ON konfigurasi_ujian.id_materi=materi.id_materi WHERE konfigurasi_ujian.id_exam=${id}`
//     db.query(sql1, (error, result1) => {
//         db.query(sql2, (error, result2) => {
//             db.query(sql3, (error, result3) => {
//                 res.render('editkonfigurasi', {exam:result1[0], materi:result2, konfigurasi_ujian:result3})
//             })
//         })
//     })
// })
// app.post('/konfigurasi/ubah/:id', (req, res) => {
//     const id = req.params.id
//     const { judul_exam, jumlah_soal } = req.body
//     const sql = `UPDATE exam SET judul_exam='${judul_exam}', jumlah_soal=${jumlah_soal} WHERE id_exam = ${id}`
//     db.query(sql, (error, result) => {
//         res.redirect(`/konfigurasi/${id}`)
//     })
// })
// app.post('/topikujian/simpan', (req,res) => {
//     const { id_exam, id_materi, persentase_materi, persentase_mudah, persentase_sedang, persentase_sulit } = req.body
//     if (parseFloat(persentase_mudah) + parseFloat(persentase_sedang) + parseFloat(persentase_sulit) == 1.0) {
//         const sql1 = `SELECT EXISTS (SELECT id_konfigurasiujian FROM konfigurasi_ujian WHERE id_exam = ${id_exam} AND id_materi = ${id_materi}) AS isExists`
//         db.query(sql1, (error, result1) => {
//             if (result1[0].isExists == 0) {
//                 const sql2 = `INSERT INTO konfigurasi_ujian (id_konfigurasiujian, id_exam, id_materi, persentase_materi, persentase_mudah, persentase_sedang, persentase_sulit) VALUES (NULL, ${id_exam}, ${id_materi}, ${persentase_materi}, ${persentase_mudah}, ${persentase_sedang}, ${persentase_sulit})`
//                 db.query(sql2, (error, result2) => {})
//             }
//         })
//     }
//     res.redirect(`/konfigurasi/${id_exam}`)
// })
// app.get('/topikujian/hapus/:id', (req, res) => {
//     const id = req.params.id
//     const sql1 = `SELECT id_exam FROM konfigurasi_ujian WHERE id_konfigurasiujian = ${id}`
//     const sql2 = `DELETE FROM konfigurasi_ujian WHERE id_konfigurasiujian = ${id}`
//     db.query(sql1, (error, result1) => {
//         db.query(sql2, (error, result2) => {})
//         res.redirect(`/konfigurasi/${result1[0].id_exam}`)
//     })
// })
// app.get('/viewkonfigurasi', (req, res) => {
//     const sql1 = 'SELECT id_paket_soal, judul, kode_paket, jumlah_soal FROM paket_soal'
//     const sql2 = `SELECT konfigurasi_ujian.id_konfigurasiujian, materi.nama_materi, konfigurasi_ujian.persentase_materi, konfigurasi_ujian.persentase_mudah, konfigurasi_ujian.persentase_sedang, konfigurasi_ujian.persentase_sulit FROM konfigurasi_ujian INNER JOIN materi ON konfigurasi_ujian.id_materi=materi.id_materi`
//     db.query(sql1, (error, result1) => {
//         if (result1.length) {
//             db.query(sql2, (error, result2) => {
//                 res.render('konfigurasi', {paket_soal:result1[0], konfigurasi_ujian:result2})
//             })
//         }
//     })
// })

// app.get('/viewsoal', (req,res) => {
//     res.render('soal', {result:materi})
// })
// //login
// app.get('/login', (res) => {
//     res.render('login')
// })

// app.post('/soal/ubah/:id', (req, res) => {
//     const id = req.params.id
//     const { pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, pilihan_benar, id_materi, tingkat_kesulitan} = req.body
//     const sql = `UPDATE soal_draft SET pertanyaan='${pertanyaan}', pilihan_a='${pilihan_a}', pilihan_b='${pilihan_b}', pilihan_c='${pilihan_c}', pilihan_d='${pilihan_d}', pilihan_benar='${pilihan_benar}', id_materi='${id_materi}', tingkat_kesulitan='${tingkat_kesulitan}' WHERE id_soal_draft = ${id}`
//     db.query(sql, (error, result) => {
//         res.redirect('/soal')
//     })
// })

// app.get('/viewsoal/tambahsoal', (req, res) => {
//     const sql1 = `SELECT id_materi, nama_materi FROM materi`
//     const sql2 = `SELECT soal_draft.id_soal_draft, materi.nama_materi,  soal_draft.tingkat_kesulitan, soal_draft.pertanyaan, soal_draft.pilihan_a,  soal_draft.pilihan_b,  soal_draft.pilihan_c,  soal_draft.pilihan_d,  soal_draft.pilihan_benar FROM soal_draft INNER JOIN materi ON soal_draft.id_materi=materi.id_materi`
//     db.query(sql1, (error, result1) => {
//         db.query(sql2, (error, result2) => {
//         //    res.render('soal', {materi:result1, soal_draft:result2})
//            res.render('tambahsoal', {materi:result1, soal_draft:result2})
//         })
//     })
// })
// app.get('/konfigurasi/:id_paket_soal', (req, res) => {
//     const id_paket_soal = req.params.id_paket_soal
//     const sql1 = `SELECT id_exam, judul_exam, jumlah_soal FROM exam WHERE id_epaket_soal = ${id_paket_soal}`
//     const sql2 = `SELECT id_materi, nama_materi FROM materi`
//     const sql3 = `SELECT konfigurasi_ujian.id_konfigurasiujian, materi.nama_materi, konfigurasi_ujian.persentase_materi, konfigurasi_ujian.persentase_mudah, konfigurasi_ujian.persentase_sedang, konfigurasi_ujian.persentase_sulit FROM konfigurasi_ujian INNER JOIN materi ON konfigurasi_ujian.id_materi=materi.id_materi WHERE konfigurasi_ujian.id_paket_soal=${id_paket_soal}`
//     db.query(sql1, (error, result1) => {
//         db.query(sql2, (error, result2) => {
//             db.query(sql3, (error, result3) => {
//                 res.render('detailpaketsoal', {paket_soal:result1[0], materi:result2, konfigurasi_ujian:result3})
//             })
//         })
//     })
// })
// //paket soal (exam)
// app.get('/paketsoal', (req, res) => {
//     const sql = `SELECT id, id_exam, nama, kode_paket FROM paket_soal`
//     db.query(sql, (error, result) => {
//         res.render('paketsoal', {paketsoal:result})
//     })
// })
// app.get('/editkonfigurasi/:id_paket_soal', (req, res) => {
//     const id_paket_soal = req.params.id_paket_soal
//     const sqlPaketSoal = SELECT * FROM paket_soal WHERE id_paket_soal = ${id_paket_soal}
//     const sqlmateri = SELECT id_materi, nama_materi FROM materi
//     const sqlTopikUjian = SELECT konfigurasi_ujian.id_konfigurasiujian, materi.nama_materi, konfigurasi_ujian.persentase_materi, konfigurasi_ujian.persentase_mudah, konfigurasi_ujian.persentase_sedang, konfigurasi_ujian.persentase_sulit FROM konfigurasi_ujian INNER JOIN materi ON konfigurasi_ujian.id_materi=materi.id_materi WHERE konfigurasi_ujian.id_paket_soal = ${id_paket_soal}
//     db.query(sqlPaketSoal, (error, result1) => {
//         if (result1.length) {
//             db.query(sqlTopikUjian, (error, result2) => {
//                 db.query(sqlmateri, (error, result3) => {
//                 // res.render('editkonfigurasi', {exam:result1[0], materi:result2, konfigurasi_ujian:result3})
//                     res.render('editkonfigurasi', {paket_soal:result1[0], konfigurasi_ujian:result2, materi:result3})
//                 })
//             })
//         }
//     })
// })
// app.get('/editkonfigurasi', (req, res) => {
//     const sql1 = 'SELECT id_paket_soal, judul, kode_paket, jumlah_soal FROM paket_soal'
//     const sql2 = `SELECT id_materi, nama_materi FROM materi`
//     const sql3 = `SELECT konfigurasi_ujian.id_konfigurasiujian, materi.nama_materi, konfigurasi_ujian.persentase_materi, konfigurasi_ujian.persentase_mudah, konfigurasi_ujian.persentase_sedang, konfigurasi_ujian.persentase_sulit FROM konfigurasi_ujian INNER JOIN materi ON konfigurasi_ujian.id_materi=materi.id_materi`
//     db.query(sql1, (error, result1) => {
//         db.query(sql2, (error, result2) => {
//             db.query(sql3, (error, result3) => {
//                 res.render('editkonfigurasi', {paket_soal:result1[0], materi:result2, konfigurasi_ujian:result3})
//             })
//         })
//     })
// })
//insert konfigurasi (html)
// app.post('/datakonfigurasi/ubah/:id_paket_soal', (req, res) => {
//     const id_paket_soal = req.params.id_paket_soal
//     const { id_materi, persentase_materi, persentase_mudah, persentase_sedang, persentase_sulit } = req.body
//     const sql1 = `INSERT INTO konfigurasi_ujian (id_konfigurasiujian, id_materi, persentase_materi, persentase_mudah, persentase_sedang, persentase_sulit) VALUES (NULL, '${id_materi}', '${persentase_materi}', '${persentase_mudah}', '${persentase_sedang}', '${persentase_sulit}') WHERE id_paket_soal = ${id_paket_soal}`
//     const sql2 = `SELECT id_konfigurasiujian FROM konfigurasi_ujian ORDER BY id_exam DESC LIMIT 1`
//     db.query(sql1, (error, result1) => {
//         db.query(sql2, (error, result2) => {
//             res.redirect('/editkonfigurasi')
//         })
//     })
// })


// app.put('/datapaketsoal/ubah/:id_paket_soal', (req, res) => {
//     const id_paket_soal = req.params.id_paket_soal;
//     const { judul, kode_paket, jumlah_soal } = req.body;

//     const sql = `UPDATE paket_soal SET 
//                   judul = COALESCE(?, judul),
//                   kode_paket = COALESCE(?, kode_paket),
//                   jumlah_soal = COALESCE(?, jumlah_soal)
//                 WHERE id_paket_soal = ?`;

//     db.query(sql, [judul, kode_paket, jumlah_soal, id_paket_soal], (error, result) => {
//         if (error) {
//             res.status(500).send({ error: 'Gagal mengubah data' });
//         } else {
//             res.redirect('/editkonfigurasi');
//         }
//     });
// });
// app.put('/soal/:id_soal_draft', (req, res) => {
//     const id_soal_draft = req.params.id_soal_draft
//     const sql = `SELECT * FROM soal_draft WHERE id_soal_draft = ${id_soal_draft}`
//     db.query(sql, (error, result) => {
//         res.send({soal_draft:result})
//     })
// })

// app.post('/soal/ubah/:id', (req, res) => {
//     const id = req.params.id
//     const { pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, pilihan_benar, id_materi, tingkat_kesulitan} = req.body
//     const sql = `UPDATE soal_draft SET pertanyaan='${pertanyaan}', pilihan_a='${pilihan_a}', pilihan_b='${pilihan_b}', pilihan_c='${pilihan_c}', pilihan_d='${pilihan_d}', pilihan_benar='${pilihan_benar}', id_materi='${id_materi}', tingkat_kesulitan='${tingkat_kesulitan}' WHERE id_soal_draft = ${id}`
//     db.query(sql, (error, result) => {
//         res.redirect('/soal')
//     })
// })

// app.put('/datasoal/ubah:id_soal_draft', (req, res) => {
//     const id_soal_draft = req.params.id_soal_draft
//     const { pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, pilihan_benar, id_materi, tingkat_kesulitan } = req.body
//     const sqlSearch = `SELECT * FROM soal WHERE id_soal_draft = ?`
//     const sqlUpdate = `UPDATE soal SET pertanyaan = ?, pilihan_a = ?, pilihan_b = ?, pilihan_c = ?, pilihan_d = ?, pilihan_benar = ?, id_materi = ?, tingkat_kesulitan = ? WHERE id_soal_draft = ?`
//     db.query(sqlSearch, [ id_soal_draft ], (error, result) => {
//         if (error) {
//             return res.status(500).json({ message: 'Ada kesalahan!' })
//         }

//         if (result.length) {
//             db.query(sqlUpdate, [ pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, pilihan_benar, id_materi, tingkat_kesulitan, id_soal_draft ], (error, result) => {
//                 if (error) {
//                     return res.status(500).json({ message: 'Soal tidak berhasil diubah!' })
//                 }
//                 res.status(200).json({ message: 'Soal berhasil diubah!' })
//             })
//         } else {
//             return res.status(404).json({ message: 'Soal tidak ditemukan!' })
//         }
//     })
// })
// app.delete('/datasoal/hapus/:id_soal_draft', (req, res) => {
//     const id_soal_draft = req.params.id_soal_draft
//     const sql = `DELETE FROM soal_draft WHERE id_soal_draft = ${id_soal_draft}`
//     db.query(sql, (error, result) => {
//         res.redirect('/soal')
//         // res.send({msg: 'Soal berhasil dihapus!'})
//     })
// })
