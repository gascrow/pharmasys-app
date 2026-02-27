import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Category } from '@/types';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Deklarasi tipe untuk getCookie
declare global {
    interface Window {
        getCookie?: (name: string) => string | null;
    }
}

// Fungsi untuk mengambil nilai cookie
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
}

// Inisialisasi getCookie di window jika belum ada
if (typeof window !== 'undefined' && !window.getCookie) {
    window.getCookie = getCookie;
}
import InputError from '@/components/InputError'; 
import { Progress } from "@/components/ui/progress"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; 
import { AlertCircle } from "lucide-react"; 
import { useState, useEffect, useMemo } from 'react';

interface PurchaseDetail {
    id: number;
    purchase_id: number;
    produk_id: number | null;
    purchase_no: string;
    supplier: string;
    nama_produk: string;
    jumlah: number;
    kemasan: string;
    harga_satuan: number;
    expired?: string;
    available_quantity: number;
    is_registered?: boolean;
}

interface ExistingProductData {
    [key: string]: {
        id: number;
        nama: string;
        category_id: number | null;
        margin: number | null;
        created_at: string;
        updated_at: string;
        nama_produk: string;
        image?: string | null;
    };
}

interface ProdukCreateProps {
    categories: Category[];
    availablePurchaseDetails: PurchaseDetail[];
    existingProductsData: ExistingProductData;
    defaultProfitMargin: number;
    initialCategoryId?: number | null;
    initialProductName?: string | null;
    initialProductImage?: string | null;
    initialMargin?: number | null;
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Products', href: route('produk.index') },
    { title: 'Add Product', href: route('produk.create') },
];

export default function ProdukCreate() {
    const page = usePage<ProdukCreateProps>();
    const {
        categories,
        availablePurchaseDetails = [],
        existingProductsData = {},
        defaultProfitMargin = 20,
        initialCategoryId,
        initialProductName,
        initialProductImage,
        initialMargin
    } = page.props;
    
    // Ambil parameter dari URL
    const searchParams = new URLSearchParams(window.location.search);
    const namaProduk = searchParams.get('nama');
    const hargaBeli = searchParams.get('harga_beli');
    
    // Auto-select produk berdasarkan nama dari URL
    useEffect(() => {
        if (namaProduk && availablePurchaseDetails.length > 0) {
            const detail = availablePurchaseDetails.find(d => 
                d.nama_produk.toLowerCase() === namaProduk.toLowerCase()
            );
            
            if (detail) {
                handlePurchaseDetailSelect(String(detail.id));
            }
        }
    }, [namaProduk, availablePurchaseDetails]);
    
    // State untuk form
    const { data, setData, post, processing, errors, progress } = useForm({
        _method: 'POST',
        nama: initialProductName || '',
        custom_nama: '',
        purchase_detail_id: '',
        category_id: initialCategoryId ? String(initialCategoryId) : '',
        harga: '',
        quantity: 0,
        margin: initialMargin !== null && initialMargin !== undefined 
            ? String(initialMargin) 
            : String(defaultProfitMargin),
        image: null as File | null,
        expired_at: '',
        use_custom_harga: false,
        custom_harga: '',
    });
    
    // State untuk UI
    const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
    const [existingImageDisplay, setExistingImageDisplay] = useState<string | null>(initialProductImage || null);
    const [useCustomName, setUseCustomName] = useState<boolean>(!initialProductName);
    const [selectedPurchaseDetail, setSelectedPurchaseDetail] = useState<PurchaseDetail | null>(null);
    const [maxQuantity, setMaxQuantity] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    
    // Inisialisasi selectedPurchaseDetail jika ada initialProductName
    useEffect(() => {
        if (initialProductName && availablePurchaseDetails?.length > 0) {
            const detail = availablePurchaseDetails.find(d => d.nama_produk === initialProductName);
            if (detail) {
                setSelectedPurchaseDetail(detail);
                setData('purchase_detail_id', String(detail.id));
                setMaxQuantity(detail.available_quantity);
            }
        }
    }, [initialProductName, availablePurchaseDetails]);
    
    // Fungsi untuk menghitung harga jual berdasarkan margin
    const calculateSellingPrice = (cost: number, margin: number): number => {
        const marginMultiplier = 1 + (parseFloat(margin.toString()) / 100);
        return Math.ceil(cost * marginMultiplier / 100) * 100; // Pembulatan ke atas ke kelipatan 100 terdekat
    };
    
    // Effect untuk menghitung harga jual saat margin atau purchase detail berubah
    useEffect(() => {
        if (selectedPurchaseDetail && data.margin && !data.use_custom_harga) {
            const cost = selectedPurchaseDetail.harga_satuan;
            const sellingPrice = calculateSellingPrice(cost, parseFloat(data.margin));
            setData('harga', sellingPrice.toString());
        }
    }, [data.margin, selectedPurchaseDetail, data.use_custom_harga]);
    
    // Clean up image previews on unmount
    useEffect(() => {
        return () => {
            if (newImagePreview) {
                URL.revokeObjectURL(newImagePreview);
            }
        };
    }, [newImagePreview]);
    
    // Effect untuk menghitung margin saat custom harga berubah
    useEffect(() => {
        if (selectedPurchaseDetail && data.use_custom_harga && data.custom_harga) {
            const cost = selectedPurchaseDetail.harga_satuan;
            const customPrice = parseFloat(data.custom_harga);
            
            if (cost > 0 && customPrice > 0) {
                // Hitung margin berdasarkan custom harga
                const margin = ((customPrice - cost) / cost) * 100;
                setData('margin', margin.toFixed(2));
                setData('harga', customPrice.toString());
            }
        }
    }, [data.custom_harga, selectedPurchaseDetail, data.use_custom_harga]);

    // Effect untuk menghitung harga jual saat custom harga diaktifkan
    useEffect(() => {
        if (data.use_custom_harga && data.custom_harga) {
            setData('harga', data.custom_harga);
        } else if (!data.use_custom_harga && selectedPurchaseDetail && data.margin) {
            const cost = selectedPurchaseDetail.harga_satuan;
            const sellingPrice = calculateSellingPrice(cost, parseFloat(data.margin));
            setData('harga', sellingPrice.toString());
        }
    }, [data.use_custom_harga, data.custom_harga, data.margin, selectedPurchaseDetail]);

    // Handle perubahan purchase detail
    useEffect(() => {
        if (selectedPurchaseDetail) {
            setMaxQuantity(selectedPurchaseDetail.available_quantity);
            const existingProdData = Object.values(existingProductsData).find(
                p => p.nama_produk === selectedPurchaseDetail.nama_produk
            );
            
            // Tentukan margin: 1. Input pengguna, 2. Margin produk yang ada, 3. Default setting, 4. Fallback '20'
            let initialMargin = data.margin;
            if (initialMargin === '' || initialMargin === (defaultProfitMargin?.toString() || '20')) {
                if (existingProdData?.margin !== null && existingProdData?.margin !== undefined) {
                    initialMargin = String(existingProdData.margin);
                } else {
                    initialMargin = defaultProfitMargin?.toString() || '20';
                }
            }

            setData({
                ...data,
                nama: selectedPurchaseDetail.nama_produk,
                expired_at: selectedPurchaseDetail.expired || '',
                category_id: existingProdData?.category_id ? String(existingProdData.category_id) : '',
                margin: initialMargin,
                quantity: selectedPurchaseDetail.available_quantity, // Set quantity otomatis
                use_custom_harga: false, // Reset custom harga saat ganti produk
                custom_harga: '', // Reset custom harga saat ganti produk
            });

            if (existingProdData?.image) {
                setExistingImageDisplay(`/storage/${existingProdData.image}`);
            } else {
                setExistingImageDisplay(null);
            }
            
            // Hitung harga jual
            const costPrice = selectedPurchaseDetail.harga_satuan;
            const marginToUse = parseFloat(initialMargin);
            if (!isNaN(marginToUse)) {
                const sellingPrice = costPrice * (1 + (marginToUse / 100));
                setData('harga', Math.round(sellingPrice).toString());
            } else {
                setData('harga', '');
            }
        } else {
            setMaxQuantity(0);
            setExistingImageDisplay(initialProductImage ? `/storage/${initialProductImage}` : null);
            setData({
                ...data,
                nama: initialProductName || '',
                expired_at: '',
                harga: '',
                margin: (initialMargin !== null && initialMargin !== undefined) 
                        ? String(initialMargin) 
                        : (defaultProfitMargin?.toString() || '20'),
                category_id: initialCategoryId ? String(initialCategoryId) : '',
                custom_nama: initialProductName ? '' : data.custom_nama,
                purchase_detail_id: '',
                quantity: 0, // Reset quantity saat tidak ada produk
                use_custom_harga: false, // Reset custom harga saat tidak ada produk
                custom_harga: '', // Reset custom harga saat tidak ada produk
            });
            setUseCustomName(!initialProductName);
        }
    }, [selectedPurchaseDetail, existingProductsData, initialProductName, initialCategoryId, initialProductImage, initialMargin, defaultProfitMargin]);

    // Fungsi untuk validasi form
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!data.purchase_detail_id) {
            newErrors.purchase_detail_id = 'Pilih produk sumber terlebih dahulu';
        }

        if (useCustomName && !data.custom_nama?.trim()) {
            newErrors.custom_nama = 'Nama produk kustom tidak boleh kosong';
        }

        if (!selectedPurchaseDetail) {
            newErrors.purchase_detail = 'Detail pembelian tidak valid';
        }

        if (data.margin && (isNaN(parseFloat(data.margin)) || parseFloat(data.margin) < 0)) {
            newErrors.margin = 'Margin harus berupa angka positif';
        }

        setFormErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle submit form yang sudah diperbaiki
    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            // Tampilkan pesan error untuk setiap field yang tidak valid
            Object.entries(formErrors).forEach(([field, message]) => {
                window.toastr?.error(message);
            });
            return;
        }

        setIsSubmitting(true);
        
        try {
            const formData = new FormData();
            const productName = useCustomName && data.custom_nama ? data.custom_nama : data.nama;
            
            // Data utama
            formData.append('_method', 'POST');
            formData.append('purchase_detail_id', data.purchase_detail_id);
            formData.append('quantity', String(data.quantity));
            formData.append('nama', productName);
            
            // Data opsional
            if (data.category_id) {
                formData.append('category_id', data.category_id);
            }
            
            // Handle harga dan margin
            if (data.use_custom_harga && data.custom_harga) {
                // Jika menggunakan custom harga, kirim harga custom dan margin yang dihitung
                formData.append('harga', data.custom_harga);
                // Margin akan dihitung otomatis di backend berdasarkan harga custom
            } else {
                // Jika tidak menggunakan custom harga, kirim margin
                if (data.margin) {
                    formData.append('margin', data.margin);
                }
            }
            
            // Handle gambar
            if (data.image && data.image instanceof File) {
                formData.append('image', data.image);
            }

            // Log data yang akan dikirim (hanya untuk development)
            if (process.env.NODE_ENV === 'development') {
                const formDataObj: Record<string, any> = {};
                formData.forEach((value, key) => {
                    formDataObj[key] = value;
                });
                console.log('Mengirim data ke server:', formDataObj);
            }

            // Kirim data ke server
            await router.post(route('produk.store'), formData, {
                forceFormData: true,
                onSuccess: () => {
                    window.toastr?.success('Produk berhasil ditambahkan');
                    // Trigger event untuk memuat ulang data gudang
                    window.dispatchEvent(new Event('warehouse:updated'));
                    // Redirect ke halaman daftar produk
                    router.visit(route('produk.index'));
                },
                onError: (errors) => {
                    console.error('Error from server:', errors);
                    let errorMessage = 'Gagal menambahkan produk. Silakan coba lagi.';
                    
                    if (typeof errors === 'string') {
                        errorMessage = errors;
                    } else if (errors && typeof errors === 'object') {
                        // Ambil pesan error pertama yang tersedia
                        const firstError = Object.values(errors)[0];
                        if (Array.isArray(firstError)) {
                            errorMessage = firstError[0] || errorMessage;
                        } else if (typeof firstError === 'string') {
                            errorMessage = firstError;
                        }
                    }
                    
                    window.toastr?.error(errorMessage);
                }
            });
        } catch (error) {
            console.error('Error in form submission:', error);
            window.toastr?.error('Terjadi kesalahan saat mengirim formulir');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle perubahan purchase detail
    useEffect(() => {
        if (selectedPurchaseDetail) {
            setMaxQuantity(selectedPurchaseDetail.available_quantity);
            const existingProdData = Object.values(existingProductsData).find(
                p => p.nama_produk === selectedPurchaseDetail.nama_produk
            );
            
            // Update data produk yang ada jika ditemukan
            if (existingProdData) {
                setData({
                    ...data,
                    category_id: existingProdData.category_id ? String(existingProdData.category_id) : '',
                    margin: existingProdData.margin !== null && existingProdData.margin !== undefined
                        ? String(existingProdData.margin)
                        : (defaultProfitMargin?.toString() || '20')
                });
            }
        }
    }, [selectedPurchaseDetail, existingProductsData]);

    // Handle perubahan gambar
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validasi tipe file
        if (!file.type.startsWith('image/')) {
            if (window.toastr) {
                window.toastr.error('File harus berupa gambar');
            }
            return;
        }

        // Validasi ukuran file (maks 2MB)
        if (file.size > 2 * 1024 * 1024) {
            if (window.toastr) {
                window.toastr.error('Ukuran gambar tidak boleh melebihi 2MB');
            }
            return;
        }

        // Set data dan preview gambar baru
        setData('image', file);
        setNewImagePreview(URL.createObjectURL(file));
        setExistingImageDisplay(null);
    };

    // Handle pemilihan purchase detail
    const handlePurchaseDetailSelect = (detailId: string) => {
        console.log('Memilih detail pembelian:', detailId);
        const detail = availablePurchaseDetails.find(d => String(d.id) === detailId);
        if (!detail) {
            console.error('Detail pembelian tidak ditemukan');
            return;
        }
        
        console.log('Detail yang dipilih:', detail);
        console.log('Data produk yang ada:', existingProductsData);
        
        // Reset form data
        setData({
            ...data,
            purchase_detail_id: detailId,
            nama: detail.nama_produk,
            category_id: '',
            margin: defaultProfitMargin?.toString() || '20',
            harga: '',
            quantity: detail.available_quantity, // Set quantity otomatis
            custom_nama: '',
            expired_at: detail.expired || ''
        });
        
        setSelectedPurchaseDetail(detail);
        setMaxQuantity(detail.available_quantity);
        
        // Cek apakah produk sudah terdaftar
        const existingProduct = Object.values(existingProductsData).find(
            p => p.nama_produk === detail.nama_produk
        );
        
        console.log('Produk yang sudah ada:', existingProduct);
        
        if (existingProduct) {
            console.log('Produk sudah terdaftar, menggunakan data yang ada');
            // Update form dengan data produk yang sudah ada
            setData(currentData => ({
                ...currentData,
                category_id: existingProduct.category_id ? String(existingProduct.category_id) : '',
                margin: existingProduct.margin !== null && existingProduct.margin !== undefined
                    ? String(existingProduct.margin)
                    : (defaultProfitMargin?.toString() || '20'),
                // Jangan timpa expired_at dari detail pembelian
                expired_at: detail.expired || ''
            }));
        }
    };
    
    // Hitung ringkasan informasi untuk produk yang sudah terdaftar
    // Menggunakan flag is_registered dari controller (berdasarkan produk_id, bukan nama)
    const availableItems = availablePurchaseDetails;
    
    // Hitung jumlah item yang sudah menjadi produk (menggunakan flag dari controller)
    const itemsAlreadyProductCount = availablePurchaseDetails.filter(detail => 
        detail.is_registered === true
    ).length;
    
    const totalSourceItems = availablePurchaseDetails.length;
    const availableItemsCount = totalSourceItems - itemsAlreadyProductCount;
    
    let summaryMessage = '';
    if (totalSourceItems > 0) {
        if (itemsAlreadyProductCount === totalSourceItems) {
            summaryMessage = "Semua item sumber yang tersedia sudah terdaftar sebagai produk. Tidak ada item baru yang bisa didaftarkan.";
        } else if (itemsAlreadyProductCount > 0) {
            summaryMessage = `${availableItemsCount} dari ${totalSourceItems} item sumber tersedia untuk didaftarkan. ${itemsAlreadyProductCount} item sudah terdaftar sebagai produk (nonaktif).`;
        } else {
            summaryMessage = "Tidak ada item sumber yang cocok dengan produk terdaftar. Semua item tersedia untuk didaftarkan.";
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Produk Baru" />
            <Card>
                <CardHeader>
                    <CardTitle>Tambah Produk Baru</CardTitle>
                    <CardDescription>Tambahkan produk baru dari data pembelian yang tersedia.</CardDescription>
                </CardHeader>
                <CardContent>
                    {availablePurchaseDetails.length === 0 ? (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>
                                Tidak ada data pembelian yang tersedia. Silakan tambahkan data pembelian terlebih dahulu.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Kolom Kiri */}
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="purchase_detail_id">Sumber Pembelian *</Label>
                                        <Select 
                                            value={data.purchase_detail_id || ""}
                                            onValueChange={handlePurchaseDetailSelect}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Pilih pembelian sumber" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableItems.map((detail) => {
                                                    // Gunakan flag is_registered dari controller (berdasarkan produk_id)
                                                    const isRegistered = detail.is_registered === true;
                                                    return (
                                                        <SelectItem
                                                            key={detail.id}
                                                            value={String(detail.id)}
                                                            disabled={isRegistered}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className={isRegistered ? 'text-gray-400' : ''}>
                                                                    {detail.nama_produk}
                                                                </span>
                                                                {isRegistered && (
                                                                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                                                                        Terdaftar
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className={`text-xs ${isRegistered ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                {detail.purchase_no} - Stok: {detail.available_quantity} {detail.kemasan}
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.purchase_detail_id} className="mt-2" />
                                    </div>

                                    <div>
                                        <Label htmlFor="nama">Nama Produk (dari Faktur)</Label>
                                        <Input
                                            id="nama"
                                            value={data.nama}
                                            className="mt-1 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            readOnly
                                        />
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="use_custom_name"
                                            checked={useCustomName}
                                            onChange={(e) => setUseCustomName(e.target.checked)}
                                            className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-800"
                                        />
                                        <Label htmlFor="use_custom_name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Gunakan nama kustom
                                        </Label>
                                    </div>

                                    {useCustomName && (
                                        <div>
                                            <Label htmlFor="custom_nama">Nama Kustom *</Label>
                                            <Input
                                                id="custom_nama"
                                                value={data.custom_nama}
                                                onChange={(e) => setData('custom_nama', e.target.value)}
                                                className="mt-1"
                                                required={useCustomName}
                                            />
                                            <InputError message={errors.custom_nama} className="mt-1" />
                                        </div>
                                    )}

                                    <div>
                                        <Label htmlFor="category_id">Kategori</Label>
                                        <Select
                                            value={data.category_id || ""}
                                            onValueChange={(value) => setData('category_id', value)}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue placeholder="Pilih kategori" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categories.map((category) => (
                                                    <SelectItem key={category.id} value={String(category.id)}>
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.category_id} className="mt-1" />
                                    </div>

                                    <div>
                                        <Label htmlFor="expired_at">Tanggal Kadaluarsa</Label>
                                        <Input
                                            id="expired_at"
                                            type="date"
                                            value={data.expired_at}
                                            className="mt-1 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            readOnly
                                        />
                                        <InputError message={errors.expired_at} className="mt-1" />
                                    </div>

                                </div>

                                {/* Kolom Kanan */}
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="margin">Margin Keuntungan (%)</Label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <Input
                                                id="margin"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={data.margin}
                                                onChange={(e) => setData('margin', e.target.value)}
                                                className={`pl-3 pr-12 ${formErrors.margin ? 'border-red-500' : ''} ${data.use_custom_harga ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`}
                                                required={!data.use_custom_harga}
                                                disabled={data.use_custom_harga}
                                            />
                                            {formErrors.margin && (
                                                <p className="mt-1 text-sm text-red-600">{formErrors.margin}</p>
                                            )}
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500 sm:text-sm">%</span>
                                            </div>
                                        </div>
                                        {data.use_custom_harga && (
                                            <p className="mt-1 text-sm text-gray-500">
                                                Margin dihitung otomatis berdasarkan harga custom
                                            </p>
                                        )}
                                        <InputError message={errors.margin} className="mt-1" />
                                    </div>

                                    <div>
                                        <Label htmlFor="harga">Harga Jual</Label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500 sm:text-sm">Rp</span>
                                            </div>
                                            <Input
                                                id="harga"
                                                type="text"
                                                value={data.harga ? new Intl.NumberFormat('id-ID').format(Number(data.harga)) : ''}
                                                className={`pl-12 ${data.use_custom_harga ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100' : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}
                                                readOnly={!data.use_custom_harga}
                                                onChange={(e) => {
                                                    if (data.use_custom_harga) {
                                                        const value = e.target.value.replace(/\D/g, '');
                                                        setData('custom_harga', value);
                                                        setData('harga', value);
                                                    }
                                                }}
                                            />
                                        </div>
                                        {data.use_custom_harga && (
                                            <p className="mt-1 text-sm text-gray-500">
                                                Harga dapat diedit langsung saat custom harga diaktifkan
                                            </p>
                                        )}
                                        <InputError message={errors.harga} className="mt-1" />
                                    </div>
                                            <div>
                                            <Label htmlFor="use_custom_harga">Custom Harga</Label>
                                            <div className="mt-1 flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id="use_custom_harga"
                                                    checked={data.use_custom_harga}
                                                    onChange={(e) => setData('use_custom_harga', e.target.checked)}
                                                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                                                />
                                                <Label htmlFor="use_custom_harga" className="text-sm font-medium text-gray-700">
                                                    Aktifkan custom harga
                                                </Label>
                                            </div>
                                            {data.use_custom_harga && (
                                                <div className="mt-2">
                                                    <Label htmlFor="custom_harga">Harga Custom</Label>
                                                    <div className="mt-1 relative rounded-md shadow-sm">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <span className="text-gray-500 sm:text-sm">Rp</span>
                                                        </div>
                                                        <Input
                                                            id="custom_harga"
                                                            type="number"
                                                            min="0"
                                                            step="100"
                                                            value={data.custom_harga}
                                                            onChange={(e) => {
                                                                setData('custom_harga', e.target.value);
                                                                setData('harga', e.target.value);
                                                            }}
                                                            className="pl-12"
                                                            placeholder="Masukkan harga custom"
                                                        />
                                                    </div>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        Margin akan otomatis disesuaikan berdasarkan harga custom
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    
                                    <div>
                                        <Label htmlFor="quantity">Jumlah</Label>
                                        <Input
                                            id="quantity"
                                            type="number"
                                            value={selectedPurchaseDetail ? selectedPurchaseDetail.available_quantity : ''}
                                            className="mt-1 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            readOnly
                                        />
                                        {selectedPurchaseDetail && (
                                            <p className="mt-1 text-sm text-gray-500">
                                                Jumlah otomatis sesuai stok tersedia: {selectedPurchaseDetail.available_quantity} {selectedPurchaseDetail.kemasan}
                                            </p>
                                        )}
                                        <InputError message={errors.quantity} className="mt-1" />
                                    </div>

                                    <div>
                                        <Label htmlFor="image">Gambar Produk</Label>
                                        {existingImageDisplay && !newImagePreview && (
                                            <div className="mt-2 mb-2">
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Gambar saat ini:</p>
                                                <img
                                                    src={existingImageDisplay}
                                                    alt="Gambar produk"
                                                    className="h-24 w-24 object-cover rounded border border-gray-200 dark:border-gray-600 mt-1"
                                                />
                                            </div>
                                        )}
                                        <Input
                                            id="image"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="mt-1"
                                        />
                                        {progress && (
                                            <div className="mt-2">
                                                <Progress value={progress.percentage} className="h-2" />
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Uploading: {progress.percentage}%
                                                </p>
                                            </div>
                                        )}
                                        {newImagePreview && (
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Pratinjau gambar baru:</p>
                                                <img
                                                    src={newImagePreview}
                                                    alt="Pratinjau gambar"
                                                    className="h-24 w-24 object-cover rounded border border-gray-200 dark:border-gray-600 mt-1"
                                                />
                                            </div>
                                        )}
                                        <InputError message={errors.image} className="mt-1" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                <Link
                                    href={route('produk.index')}
                                    className="inline-flex items-center px-4 py-2 bg-background border border-border rounded-md font-semibold text-xs text-foreground uppercase tracking-widest shadow-sm hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition"
                                >
                                    Batal
                                </Link>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}
                                </button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </AppLayout>
    );
}
