'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Stepper from '@/components/ui/Stepper';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useDuplicateCheck } from '@/hooks/useDuplicateCheck';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Save, CheckCircle2 } from 'lucide-react';

// ── Validation Schemas ──
const guardianSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  birth_place: z.string().optional(),
  religion: z.string().optional(),
  occupation: z.string().optional(),
  income_per_month: z.coerce.number().optional(),
  last_education: z.string().optional(),
  phone_number: z.string().optional(),
  address: z.string().optional(),
  relationship_description: z.string().optional(),
});

const studentSchema = z.object({
  // Step 1: Identitas
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  nisn: z.string().length(10, 'NISN harus 10 digit'),
  nik: z.string().length(16, 'NIK harus 16 digit'),
  gender: z.enum(['L', 'P'], { required_error: 'Pilih jenis kelamin' }),
  birth_place: z.string().min(1, 'Tempat lahir wajib diisi'),
  birth_date: z.string().min(1, 'Tanggal lahir wajib diisi'),
  tahun_masuk: z.coerce.number().min(2000, 'Tahun tidak valid'),
  guardian_type: z.enum(['ayah', 'ibu', 'orang_lain']),
  
  // Step 2: Keluarga
  father: guardianSchema,
  mother: guardianSchema,
  guardian: guardianSchema.optional(),

  // Step 3: Riwayat & Akademik
  sibling_order: z.coerce.number().min(1, 'Anak ke- wajib diisi'),
  total_siblings: z.coerce.number().min(1, 'Jumlah saudara wajib diisi'),
  medical_history: z.string().optional(),
  status: z.array(z.string()).optional(),

  // Step 4: Alamat Tinggal
  address_street: z.string().optional(),
  address_rt: z.string().optional(),
  address_rw: z.string().optional(),
  address_village: z.string().optional(),
  address_district: z.string().optional(),
  address_city: z.string().optional(),
  address_province: z.string().optional(),
  address_postal_code: z.string().optional(),
  
  // Enrollment (Optional untuk form ini, bisa diisi lewat menu lain, tapi disediakan field dasar)
  class_id: z.string().optional(),
  academic_year_id: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

const steps = [
  { id: 'identitas', label: 'Identitas Diri' },
  { id: 'keluarga', label: 'Data Keluarga' },
  { id: 'riwayat', label: 'Riwayat & Akademik' },
  { id: 'alamat', label: 'Alamat Tinggal' },
];

export default function TambahSiswaPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      status: ['Umum'],
      guardian_type: 'ayah',
      tahun_masuk: new Date().getFullYear(),
    },
    mode: 'onTouched',
  });

  const { handleSubmit, trigger, watch } = methods;
  const guardianType = watch('guardian_type');

  // Autosave
  const { saveNow, clear, restore } = useAutoSave<StudentFormValues>('form_tambah_siswa', watch(), true);

  useEffect(() => {
    const saved = restore();
    if (saved?.data) {
      methods.reset(saved.data);
      toast('Draft sebelumnya dipulihkan', { icon: '📝' });
    }
  }, []);

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 0) {
      fieldsToValidate = ['name', 'nisn', 'nik', 'gender', 'birth_place', 'birth_date', 'tahun_masuk', 'guardian_type'];
    } else if (currentStep === 1) {
      fieldsToValidate = ['father.name', 'mother.name'];
      if (guardianType === 'orang_lain') fieldsToValidate.push('guardian.name');
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      saveNow();
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const onSubmit = async (data: StudentFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await api.post('/students', data);
      clear(); // Hapus draft
      toast.success('Siswa berhasil ditambahkan!');
      router.push(`/siswa/${res.data.data.id}`);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menyimpan data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-800">Tambah Siswa Baru</h1>
          <p className="text-stone-500 mt-1">Masukkan data buku induk peserta didik secara lengkap</p>
        </div>
      </div>

      <div className="mb-8 max-w-3xl mx-auto">
        <Stepper steps={steps} currentStepIndex={currentStep} />
      </div>

      <Card className="max-w-4xl mx-auto">
        <FormProvider {...methods}>
          <form onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
            <CardContent className="p-6">
              {currentStep === 0 && <StepIdentitas />}
              {currentStep === 1 && <StepKeluarga guardianType={guardianType} />}
              {currentStep === 2 && <StepRiwayat />}
              {currentStep === 3 && <StepAlamat />}
            </CardContent>

            <CardFooter className="justify-between">
              <Button type="button" variant="secondary" onClick={prevStep} disabled={currentStep === 0 || isSubmitting}>
                Sebelumnya
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button type="button" variant="primary" onClick={nextStep}>
                  Selanjutnya <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="button" variant="primary" isLoading={isSubmitting} onClick={handleSubmit(onSubmit)}>
                  <Save className="w-4 h-4 mr-2" /> Simpan Data
                </Button>
              )}
            </CardFooter>
          </form>
        </FormProvider>
      </Card>
    </DashboardLayout>
  );
}

// ── Step 1: Identitas ──
function StepIdentitas() {
  const { register, formState: { errors }, watch } = useFormContext<StudentFormValues>();
  const { check: checkDuplicate, isDuplicate, checking } = useDuplicateCheck();
  
  const nisn = watch('nisn');
  const nik = watch('nik');

  return (
    <div className="space-y-6 animate-fade-in">
      <CardTitle>Identitas Siswa</CardTitle>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Nama Lengkap"
          {...register('name')}
          error={errors.name?.message}
          required
        />
        <Select
          label="Jenis Kelamin"
          options={[
            { label: 'Laki-laki', value: 'L' },
            { label: 'Perempuan', value: 'P' },
          ]}
          {...register('gender')}
          error={errors.gender?.message}
          required
        />
        
        <div>
          <Input
            label="NISN"
            {...register('nisn')}
            error={errors.nisn?.message || (isDuplicate && nisn.length === 10 ? 'NISN sudah terdaftar' : undefined)}
            onChange={(e) => {
              register('nisn').onChange(e);
              if (e.target.value.length === 10) checkDuplicate('nisn', e.target.value);
            }}
            hint="10 digit nomor unik"
            required
            maxLength={10}
          />
          {checking && <p className="text-xs text-stone-500 mt-1">Mengecek NISN...</p>}
        </div>

        <Input
          label="NIK"
          {...register('nik')}
          error={errors.nik?.message}
          hint="16 digit sesuai Kartu Keluarga"
          required
          maxLength={16}
        />

        <Input
          label="Tempat Lahir"
          {...register('birth_place')}
          error={errors.birth_place?.message}
          required
        />
        <Input
          label="Tanggal Lahir"
          type="date"
          {...register('birth_date')}
          error={errors.birth_date?.message}
          required
        />

        <Input
          label="Tahun Masuk"
          type="number"
          {...register('tahun_masuk')}
          error={errors.tahun_masuk?.message}
          required
        />

        <Select
          label="Penanggung Jawab (Wali)"
          options={[
            { label: 'Ayah Kandung', value: 'ayah' },
            { label: 'Ibu Kandung', value: 'ibu' },
            { label: 'Orang Lain / Wali', value: 'orang_lain' },
          ]}
          {...register('guardian_type')}
          error={errors.guardian_type?.message}
          required
        />
      </div>
    </div>
  );
}

// ── Step 2: Keluarga ──
function StepKeluarga({ guardianType }: { guardianType: string }) {
  const { register, formState: { errors } } = useFormContext<StudentFormValues>();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Ayah */}
      <div>
        <h4 className="font-medium text-slate-800 mb-4 pb-2 border-b border-stone-100 flex items-center gap-2">
          {guardianType === 'ayah' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />} Data Ayah Kandung
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Nama Ayah" {...register('father.name')} error={errors.father?.name?.message} required />
          <Input label="Pekerjaan" {...register('father.occupation')} />
          <Input label="No. Telepon" {...register('father.phone_number')} />
          <Select
            label="Pendidikan Terakhir"
            options={[
              { label: 'Tidak Sekolah', value: 'Tidak Sekolah' },
              { label: 'SD/Sederajat', value: 'SD' },
              { label: 'SMP/Sederajat', value: 'SMP' },
              { label: 'SMA/Sederajat', value: 'SMA' },
              { label: 'D1-D3', value: 'Diploma' },
              { label: 'S1', value: 'S1' },
              { label: 'S2/S3', value: 'S2/S3' },
            ]}
            {...register('father.last_education')}
          />
        </div>
      </div>

      {/* Ibu */}
      <div>
        <h4 className="font-medium text-slate-800 mb-4 pb-2 border-b border-stone-100 flex items-center gap-2">
          {guardianType === 'ibu' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />} Data Ibu Kandung
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input label="Nama Ibu" {...register('mother.name')} error={errors.mother?.name?.message} required />
          <Input label="Pekerjaan" {...register('mother.occupation')} />
          <Input label="No. Telepon" {...register('mother.phone_number')} />
        </div>
      </div>

      {/* Wali */}
      {guardianType === 'orang_lain' && (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
          <h4 className="font-medium text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Data Wali (Penanggung Jawab)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Nama Wali" {...register('guardian.name')} error={errors.guardian?.name?.message} required />
            <Input label="Hubungan dengan Siswa" placeholder="Contoh: Paman, Kakek" {...register('guardian.relationship_description')} required />
            <Input label="Pekerjaan" {...register('guardian.occupation')} />
            <Input label="No. Telepon" {...register('guardian.phone_number')} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 3: Riwayat ──
function StepRiwayat() {
  const { register, formState: { errors } } = useFormContext<StudentFormValues>();

  return (
    <div className="space-y-6 animate-fade-in">
      <CardTitle>Riwayat & Akademik</CardTitle>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Anak Ke-"
          type="number"
          {...register('sibling_order')}
          error={errors.sibling_order?.message}
          required
        />
        <Input
          label="Dari Jumlah Saudara"
          type="number"
          {...register('total_siblings')}
          error={errors.total_siblings?.message}
          required
        />
        
        <div className="md:col-span-2">
          <Input
            label="Riwayat Penyakit"
            {...register('medical_history')}
            hint="Kosongkan jika tidak ada riwayat penyakit serius"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-slate-700 block mb-2">Status Khusus</label>
          <div className="flex gap-4 flex-wrap">
            {['Umum', 'Yatim', "Dhu'afa", 'Piatu'].map(s => (
              <label key={s} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input type="checkbox" value={s} {...register('status')} className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500" />
                {s}
              </label>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mt-6">
        <p className="text-sm text-blue-800">
          Penempatan kelas (Enrollment) dapat dilakukan nanti melalui menu detail siswa atau fitur kenaikan kelas massal.
        </p>
      </div>
    </div>
  );
}

// ── Step 4: Alamat Tinggal ──
function StepAlamat() {
  const { register } = useFormContext<StudentFormValues>();

  return (
    <div className="space-y-6 animate-fade-in">
      <CardTitle>Alamat Tinggal</CardTitle>
      <p className="text-sm text-stone-500">Isi detail alamat tinggal siswa secara lengkap.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2">
          <Input
            label="Jalan / Perumahan / Gang"
            {...register('address_street')}
            hint="Contoh: Jl. Merdeka No. 1, Perum Griya Indah Blok A3"
          />
        </div>
        <Input label="RT" {...register('address_rt')} hint="Contoh: 001" maxLength={5} />
        <Input label="RW" {...register('address_rw')} hint="Contoh: 002" maxLength={5} />
        <Input label="Kelurahan / Desa" {...register('address_village')} />
        <Input label="Kecamatan" {...register('address_district')} />
        <Input label="Kabupaten / Kota" {...register('address_city')} />
        <Input label="Provinsi" {...register('address_province')} />
        <Input label="Kode Pos" {...register('address_postal_code')} maxLength={10} />
      </div>

      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 mt-4">
        <p className="text-sm text-emerald-800">
          ✅ Ini adalah langkah terakhir. Periksa kembali semua data sebelum menyimpan.
        </p>
      </div>
    </div>
  );
}
