import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getApiError } from '@/lib/api';
import { updateCurrentUser, updatePassword, deleteCurrentUser } from '@/lib/services/users.service';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function FarmerSettings() {
  const { user, logout, setUser } = useAuth();
  const { toast } = useToast();

  const [fullName,    setFullName]    = useState(user?.full_name    ?? '');
  const [email,       setEmail]       = useState(user?.email        ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number ?? '');
  const [address,     setAddress]     = useState(user?.address      ?? '');
  const [profileSaving, setProfileSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [passwordSaving,  setPasswordSaving]  = useState(false);

  const [deleting, setDeleting] = useState(false);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const updated = await updateCurrentUser({ full_name: fullName, email, phone_number: phoneNumber, address });
      setUser(updated);
      toast({ title: 'Your profile has been updated.' });
    } catch (err) {
      toast({ title: getApiError(err), variant: 'destructive' });
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaving(true);
    try {
      await updatePassword({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword('');
      setNewPassword('');
      toast({ title: 'Your password has been updated.' });
    } catch (err) {
      toast({ title: getApiError(err), variant: 'destructive' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteCurrentUser();
      logout();
    } catch (err) {
      toast({ title: getApiError(err), variant: 'destructive' });
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 md:px-8 md:py-10 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Account Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile and preferences.</p>
      </div>

      <form onSubmit={saveProfile} className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="space-y-2"><Label>Full Name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} /></div>
        <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div className="space-y-2"><Label>Phone</Label><Input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} /></div>
        <div className="space-y-2"><Label>Address</Label><Input value={address} onChange={e => setAddress(e.target.value)} /></div>
        <Button type="submit" disabled={profileSaving}>{profileSaving ? 'Saving…' : 'Save Changes'}</Button>
      </form>

      <form onSubmit={changePassword} className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h2 className="font-semibold text-foreground">Change Password</h2>
        <div className="space-y-2"><Label>Current Password</Label><Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required /></div>
        <div className="space-y-2"><Label>New Password</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} /></div>
        <Button type="submit" variant="outline" disabled={passwordSaving}>{passwordSaving ? 'Updating…' : 'Update Password'}</Button>
      </form>

      <div className="bg-card rounded-xl border border-border p-6 space-y-3">
        <Button type="button" variant="outline" onClick={logout} className="w-full">Log Out</Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" className="w-full">Delete Account</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove your account and all associated data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep My Account</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? 'Deleting…' : 'Yes, Delete Account'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
