import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import OrderHistoryClient from './OrderHistoryClient'

export default async function OrderHistoryPage() {
    const supabase = await createClient()

    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Fetch profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Fetch archived orders
    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            *,
            customer:customers(*),
            creator:profiles!created_by(id, full_name),
            brand:brands(*)
        `)
        .eq('is_archived', true)
        .order('shipped_at', { ascending: false, nullsFirst: false })

    if (error) {
        console.error('Error fetching archived orders:', error)
    }

    // Fetch active brands for filter
    const { data: brands } = await supabase
        .from('brands')
        .select('id, code, name')
        .eq('is_active', true)
        .order('name', { ascending: true })

    return (
        <DashboardLayout user={profile}>
            {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Gagal memuat riwayat order: {error.message}
                </div>
            )}
            <OrderHistoryClient orders={orders || []} brands={brands || []} />
        </DashboardLayout>
    )
}
