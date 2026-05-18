import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

export const metadata = { title: 'Settings — Jilani Properties CRM' };

export default function SettingsPage() {
  return (
    <PageContainer>
      <div className='space-y-6'>
        <Heading title='Settings' description='Manage system configuration and preferences' />
        <Separator />
        <div className='text-muted-foreground py-16 text-center text-sm'>
          Settings module coming soon.
        </div>
      </div>
    </PageContainer>
  );
}
