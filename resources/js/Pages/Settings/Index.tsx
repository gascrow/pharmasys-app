// Placeholder Page
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage, useForm, Link, router } from '@inertiajs/react';
import { type FormDataConvertible } from '@inertiajs/core';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import InputError from "@/components/InputError";
import { FlashMessage } from '@/components/flash-message';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Upload, Image, Info, Globe, DollarSign, Trash2, AlertTriangle } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";

// Interface for the specific shape of the settings form data
interface SettingsFormShape {
    app_name: string;
    app_currency: string;
    app_logo: File | null;
    app_favicon: File | null;
    language: string;
    current_logo: string | null;
    current_favicon: string | null;
    remove_logo: boolean;
    remove_favicon: boolean;
    low_stock_threshold: number;
    default_profit_margin: number;
}

type FormDataType = Record<string, FormDataConvertible>;

interface DataCounts {
    produk: number;
    purchase: number;
    purchase_detail: number;
    sale: number;
    sale_item: number;
    supplier: number;
    category: number;
}

interface SettingsPageProps {
    settings: {
        app_name: string;
        app_currency: string;
        app_logo?: string | null;
        app_favicon?: string | null;
        language?: string;
        low_stock_threshold: number;
        default_profit_margin: number;
    };
    dataCounts?: DataCounts;
    flash?: {
        success?: string;
        error?: string;
    };
    errors: Record<string, string>; 
    [key: string]: any; 
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Settings', href: route('settings.index') },
    { title: 'General Settings', href: route('settings.index') },
];

export default function SettingsIndex() {
    const page = usePage<SettingsPageProps>();
    const { settings, dataCounts, flash, errors: pageLevelErrors } = page.props;
    const [activeTab, setActiveTab] = useState("general");
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
    
    // State for reset data
    const [resetOptions, setResetOptions] = useState<string[]>([]);
    const [isResetting, setIsResetting] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    
    const initialSettingsData: SettingsFormShape = {
        app_name: settings.app_name ?? 'PharmaSys',
        app_currency: settings.app_currency ?? 'Rp',
        app_logo: null,
        app_favicon: null,
        language: settings.language ?? 'id',
        current_logo: settings.app_logo ?? null,
        current_favicon: settings.app_favicon ?? null,
        remove_logo: false,
        remove_favicon: false,
        low_stock_threshold: settings.low_stock_threshold ?? 10,
        default_profit_margin: settings.default_profit_margin ?? 20,
    };
    
    const { data, setData, post, errors: formErrors, processing, reset } = useForm<SettingsFormShape & FormDataType>(initialSettingsData as (SettingsFormShape & FormDataType));

    useEffect(() => {
        if (settings.app_logo) {
            setLogoPreview(`/storage/${settings.app_logo}`);
        }
        if (settings.app_favicon) {
            setFaviconPreview(`/storage/${settings.app_favicon}`);
        }
    }, [settings]);

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post(route('settings.update'), {
            preserveScroll: true,
            onSuccess: () => {
                reset('app_logo', 'app_favicon');
            }
        });
    }

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('app_logo', file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogoPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
            setData('remove_logo', false);
        }
    };
    
    const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('app_favicon', file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setFaviconPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
            setData('remove_favicon', false);
        }
    };
    
    const handleRemoveLogo = () => {
        setData('remove_logo', true);
        setData('app_logo', null);
        setLogoPreview(null);
    };
    
    const handleRemoveFavicon = () => {
        setData('remove_favicon', true);
        setData('app_favicon', null);
        setFaviconPreview(null);
    };

    // Reset data handlers
    const toggleResetOption = (option: string) => {
        if (option === 'all') {
            if (resetOptions.includes('all')) {
                setResetOptions([]);
            } else {
                setResetOptions(['all']);
            }
        } else {
            const newOptions = resetOptions.filter(o => o !== 'all');
            if (newOptions.includes(option)) {
                setResetOptions(newOptions.filter(o => o !== option));
            } else {
                setResetOptions([...newOptions, option]);
            }
        }
    };

    const handleResetData = () => {
        if (resetOptions.length === 0) {
            window.toastr?.error('Pilih minimal satu data yang ingin direset');
            return;
        }
        setShowResetConfirm(true);
    };

    const confirmResetData = () => {
        setIsResetting(true);
        
        const formData = new FormData();
        resetOptions.forEach(option => {
            formData.append('reset_options[]', option);
        });

        router.post(route('settings.resetData'), formData, {
            onSuccess: () => {
                setIsResetting(false);
                setShowResetConfirm(false);
                setResetOptions([]);
                // Reload page to get updated counts
                router.reload({ only: ['dataCounts'] });
            },
            onError: () => {
                setIsResetting(false);
                setShowResetConfirm(false);
                window.toastr?.error('Gagal mereset data');
            }
        });
    };

    const resetDataOptions = [
        { id: 'products', label: 'Produk', count: dataCounts?.produk || 0 },
        { id: 'purchase_details', label: 'Detail Pembelian', count: dataCounts?.purchase_detail || 0 },
        { id: 'purchases', label: 'Pembelian', count: dataCounts?.purchase || 0 },
        { id: 'sale_items', label: 'Item Penjualan', count: dataCounts?.sale_item || 0 },
        { id: 'sales', label: 'Penjualan', count: dataCounts?.sale || 0 },
        { id: 'suppliers', label: 'Supplier', count: dataCounts?.supplier || 0 },
        { id: 'categories', label: 'Kategori', count: dataCounts?.category || 0 },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="General Settings" />
            
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">General Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Konfigurasi pengaturan dasar aplikasi PharmaSys
                </p>
            </div>
            
            <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6 w-full max-w-lg">
                    <TabsTrigger value="general" className="flex items-center gap-2">
                        <SettingsIcon className="h-4 w-4" />
                        <span>Umum</span>
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        <span>Tampilan</span>
                    </TabsTrigger>
                    <TabsTrigger value="language" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>Bahasa</span>
                    </TabsTrigger>
                    <TabsTrigger value="reset" className="flex items-center gap-2 text-red-600">
                        <Trash2 className="h-4 w-4" />
                        <span>Reset Data</span>
                    </TabsTrigger>
                </TabsList>
                
                <form onSubmit={submit} className="space-y-6">
                    <FlashMessage flash={flash} />
                
                    <TabsContent value="general" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pengaturan Umum</CardTitle>
                                <CardDescription>Informasi dasar aplikasi</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="app_name">Nama Aplikasi *</Label>
                                        <Input
                                            id="app_name"
                                            name="app_name"
                                            value={data.app_name}
                                            onChange={(e) => setData('app_name', e.target.value)}
                                            className="mt-1 block w-full"
                                            required
                                        />
                                        <p className="text-sm text-gray-500 mt-1">Nama untuk aplikasi ini</p>
                                        <InputError message={formErrors.app_name} className="mt-2" />
                                    </div>
                                    
                                    <div>
                                        <Label htmlFor="app_currency">Mata Uang *</Label>
                                        <Input
                                            id="app_currency"
                                            name="app_currency"
                                            value={data.app_currency}
                                            onChange={(e) => setData('app_currency', e.target.value)}
                                            className="mt-1 block w-full"
                                            required
                                        />
                                        <p className="text-sm text-gray-500 mt-1">Simbol mata uang (contoh: Rp, $, €)</p>
                                        <InputError message={formErrors.app_currency} className="mt-2" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-4 border-t mt-4">
                                    <div>
                                        <Label htmlFor="low_stock_threshold">Low Stock Threshold *</Label>
                                        <Input
                                            id="low_stock_threshold"
                                            name="low_stock_threshold"
                                            type="number"
                                            value={data.low_stock_threshold}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value, 10);
                                                setData('low_stock_threshold', isNaN(val) ? 0 : val);
                                            }}
                                            className="mt-1 block w-full"
                                            required
                                            min="0"
                                        />
                                        <p className="text-sm text-gray-500 mt-1">Batas minimum stok sebelum produk ditandai "Stok Sedikit".</p>
                                        <InputError message={formErrors.low_stock_threshold} className="mt-2" />
                                    </div>
                                    <div>
                                        <Label htmlFor="default_profit_margin">Default Profit Margin (%) *</Label>
                                        <Input
                                            id="default_profit_margin"
                                            name="default_profit_margin"
                                            type="number"
                                            value={data.default_profit_margin}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                setData('default_profit_margin', isNaN(val) ? 0 : val);
                                            }}
                                            className="mt-1 block w-full"
                                            required
                                            min="0"
                                            step="0.01"
                                        />
                                        <p className="text-sm text-gray-500 mt-1">Margin keuntungan default untuk perhitungan harga jual produk.</p>
                                        <InputError message={formErrors.default_profit_margin} className="mt-2" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="appearance" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Logo & Favicon</CardTitle>
                                <CardDescription>Identitas visual aplikasi</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <Label htmlFor="app_logo">Upload Logo</Label>
                                    <div className="mt-2 flex items-center gap-4">
                                        {logoPreview && (
                                            <div className="relative">
                                                <img src={logoPreview} alt="Logo Preview" className="h-16 w-auto object-contain rounded border p-1" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <Input id="app_logo" name="app_logo" type="file" onChange={handleLogoChange} className="mt-1 block w-full cursor-pointer" accept="image/*" />
                                            <p className="text-sm text-gray-500 mt-1">Disarankan ukuran gambar 150px x 150px</p>
                                        </div>
                                        {logoPreview && (
                                            <Button type="button" variant="secondary" size="sm" onClick={handleRemoveLogo}>Hapus</Button>
                                        )}
                                    </div>
                                    <InputError message={formErrors.app_logo} className="mt-1" />
                                </div>

                                <div>
                                    <Label htmlFor="app_favicon">Upload Favicon</Label>
                                    <div className="mt-2 flex items-center gap-4">
                                        {faviconPreview && (
                                            <div className="relative">
                                                <img src={faviconPreview} alt="Favicon Preview" className="h-12 w-auto object-contain rounded border p-1" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <Input id="app_favicon" name="app_favicon" type="file" onChange={handleFaviconChange} className="mt-1 block w-full cursor-pointer" accept="image/*" />
                                            <p className="text-sm text-gray-500 mt-1">Disarankan ukuran gambar 16px x 16px atau 32px x 32px</p>
                                        </div>
                                        {faviconPreview && (
                                            <Button type="button" variant="secondary" size="sm" onClick={handleRemoveFavicon}>Hapus</Button>
                                        )}
                                    </div>
                                    <InputError message={formErrors.app_favicon} className="mt-1" />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="language" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pengaturan Bahasa</CardTitle>
                                <CardDescription>Konfigurasi bahasa aplikasi</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="language">Bahasa Default</Label>
                                        <select
                                            id="language"
                                            name="language"
                                            value={data.language}
                                            onChange={(e) => setData('language', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 h-10 px-3"
                                        >
                                            <option value="id">Indonesia</option>
                                            <option value="en">English</option>
                                        </select>
                                        <p className="text-sm text-gray-500 mt-1">Bahasa utama yang digunakan dalam aplikasi</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="reset" className="space-y-6">
                        <Card className="border-red-200 dark:border-red-800">
                            <CardHeader className="bg-red-50 dark:bg-red-900/20">
                                <CardTitle className="flex items-center gap-2 text-red-600">
                                    <Trash2 className="h-5 w-5" />
                                    Reset Data
                                </CardTitle>
                                <CardDescription className="text-red-600/80">
                                    Perhatian! Fitur ini akan menghapus data secara permanen. Pilih data yang ingin direset.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="space-y-3">
                                    {resetDataOptions.map((option) => (
                                        <div key={option.id} className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                id={option.id}
                                                checked={resetOptions.includes(option.id) || resetOptions.includes('all')}
                                                onChange={() => toggleResetOption(option.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                            />
                                            <Label htmlFor={option.id} className="flex items-center justify-between flex-1 cursor-pointer">
                                                <span>{option.label}</span>
                                                <span className="text-sm text-gray-500">({option.count} data)</span>
                                            </Label>
                                        </div>
                                    ))}
                                    
                                    <div className="flex items-center space-x-3 pt-2 border-t">
                                        <input
                                            type="checkbox"
                                            id="all"
                                            checked={resetOptions.includes('all')}
                                            onChange={() => toggleResetOption('all')}
                                            className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                        />
                                        <Label htmlFor="all" className="flex items-center justify-between flex-1 cursor-pointer font-semibold">
                                            <span>Reset Semua Data</span>
                                        </Label>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        type="button"
                                        onClick={handleResetData}
                                        disabled={resetOptions.length === 0 || isResetting}
                                        variant="destructive"
                                        className="w-full"
                                    >
                                        {isResetting ? 'Memproses...' : 'Reset Data Sekarang'}
                                    </Button>
                                </div>

                                {showResetConfirm && (
                                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
                                            <div className="flex items-center gap-3 text-red-600 mb-4">
                                                <AlertTriangle className="h-6 w-6" />
                                                <h3 className="text-lg font-semibold">Konfirmasi Reset Data</h3>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                                Anda yakin ingin mereset data berikut? Tindakan ini tidak dapat dibatalkan.
                                            </p>
                                            <ul className="text-sm text-gray-500 mb-6 space-y-1">
                                                {resetOptions.includes('all') ? (
                                                    <li>• Semua Data</li>
                                                ) : (
                                                    resetOptions.map(opt => {
                                                        const option = resetDataOptions.find(o => o.id === opt);
                                                        return option ? <li key={opt}>• {option.label} ({option.count} data)</li> : null;
                                                    })
                                                )}
                                            </ul>
                                            <div className="flex gap-3">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    onClick={() => setShowResetConfirm(false)}
                                                    className="flex-1"
                                                >
                                                    Batal
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={confirmResetData}
                                                    className="flex-1 bg-red-600 hover:bg-red-700"
                                                >
                                                    Ya, Reset
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {activeTab !== 'reset' && (
                        <div className="flex items-center justify-end space-x-4 pt-4">
                            <Button type="button" variant="secondary" onClick={() => reset('app_name', 'app_currency', 'low_stock_threshold', 'default_profit_margin', 'language', 'app_logo', 'app_favicon', 'remove_logo', 'remove_favicon')}>
                                Reset
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-green-600 hover:bg-green-700">
                                {processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                            </Button>
                        </div>
                    )}
                </form>
            </Tabs>
        </AppLayout>
    );
}
