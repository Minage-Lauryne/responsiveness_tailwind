"use client";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { interests } from "@/lib/data/interests";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { ProfilePictureUpload } from "./profile-picture-upload";
import ManageAccountPage from "./manage-account";

type TabType = "profile" | "notifications" | "settings";

export function ProfileContainer() {
  const { data: me, isLoading } = api.me.get.useQuery();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    firstName: "",
    orgName: "",
    location: "",
    orgUrl: "",
  });
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [notificationPrefs, setNotificationPrefs] = useState({
    marketingEmails: false,
    productUpdates: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formChanged, setFormChanged] = useState(false);
  const [notificationsChanged, setNotificationsChanged] = useState(false);
  const [initialData, setInitialData] = useState({
    name: "",
    firstName: "",
    orgName: "",
    location: "",
    orgUrl: "",
    interests: [] as string[],
    marketingEmails: false,
    productUpdates: false,
  });
  const [profileStrength, setProfileStrength] = useState(0);

  // Initialize form with user data if available
  useEffect(() => {
    if (me) {
      const userData = {
        name: me.name || "",
        firstName: me.firstName || "",
        orgName: me.activeOrganization?.name || "",
        location: me.location || "",
        orgUrl: me?.url || "",
        interests: me.interests || [],
        marketingEmails: me.marketingEmails || false,
        productUpdates: me.productUpdates || false,
      };

      setFormData({
        name: userData.name,
        firstName: userData.firstName,
        orgName: userData.orgName,
        location: userData.location,
        orgUrl: userData.orgUrl,
      });

      setNotificationPrefs({
        marketingEmails: userData.marketingEmails,
        productUpdates: userData.productUpdates,
      });

      setSelectedInterests(userData.interests);
      setInitialData(userData);
    }
  }, [me]);

  // Calculate profile strength
  useEffect(() => {
    const fields = [
      !!formData.name, // Has name
      !!formData.firstName, // Has first name
      !!formData.orgName, // Has org name
      !!formData.location, // Has location
      !!formData.orgUrl, // Has org URL
      selectedInterests.length >= 3, // Has at least 3 interests
    ];

    const filledFields = fields.filter(Boolean).length;
    const percentage = Math.round((filledFields / fields.length) * 100);

    setProfileStrength(percentage);
  }, [formData, selectedInterests]);

  // Check if form data has changed
  useEffect(() => {
    const hasChanged =
      formData.name !== initialData.name ||
      formData.firstName !== initialData.firstName ||
      formData.orgName !== initialData.orgName ||
      formData.location !== initialData.location ||
      formData.orgUrl !== initialData.orgUrl ||
      !arraysEqual(selectedInterests, initialData.interests);

    setFormChanged(hasChanged);
  }, [formData, selectedInterests, initialData]);

  // Check if notification preferences have changed
  useEffect(() => {
    const hasChanged =
      notificationPrefs.marketingEmails !== initialData.marketingEmails ||
      notificationPrefs.productUpdates !== initialData.productUpdates;

    setNotificationsChanged(hasChanged);
  }, [notificationPrefs, initialData]);

  const arraysEqual = (a: string[], b: string[]) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, idx) => val === sortedB[idx]);
  };

  const updateUser = api.me.update.useMutation({
    onSuccess: () => {
      toast.success("Profile updated");
      setIsSubmitting(false);
      setFormChanged(false);
      setInitialData({
        ...initialData,
        name: formData.name,
        firstName: formData.firstName,
        orgName: formData.orgName,
        location: formData.location,
        orgUrl: formData.orgUrl,
        interests: [...selectedInterests],
      });
    },
    onError: (error) => {
      toast.error(`Error updating profile: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const updateNotifications = api.me.updateNotifications.useMutation({
    onSuccess: () => {
      toast.success("Notification preferences updated");
      setIsSubmitting(false);
      setNotificationsChanged(false);
      setInitialData({
        ...initialData,
        marketingEmails: notificationPrefs.marketingEmails,
        productUpdates: notificationPrefs.productUpdates,
      });
    },
    onError: (error) => {
      toast.error(`Error updating notification preferences: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNotificationToggle = (type: keyof typeof notificationPrefs) => {
    setNotificationPrefs((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formChanged) {
      return;
    }

    setIsSubmitting(true);

    updateUser.mutate({
      name: formData.name,
      firstName: formData.firstName,
      location: formData.location,
      url: formData.orgUrl,
      organization: {
        name: formData.orgName,
      },
      interests: selectedInterests,
    });
  };

  const handleNotificationsSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!notificationsChanged) {
      return;
    }

    setIsSubmitting(true);

    updateNotifications.mutate({
      marketingEmails: notificationPrefs.marketingEmails,
      productUpdates: notificationPrefs.productUpdates,
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-light">Account</h1>
        {activeTab === "profile" && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Profile Strength</span>
            <div className="h-2 w-[200px] overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-blue-400 transition-all duration-300"
                style={{ width: `${profileStrength}%` }}
              ></div>
            </div>
            <span className="text-sm">{profileStrength}%</span>
          </div>
        )}
      </div>

      <div className="mb-8 flex gap-4">
        <Button
          variant={activeTab === "profile" ? "default" : "outline"}
          onClick={() => setActiveTab("profile")}
        >
          My Profile
        </Button>
        <Button
          variant={activeTab === "notifications" ? "default" : "outline"}
          onClick={() => setActiveTab("notifications")}
        >
          Notification Settings
        </Button>
        <Button
          variant={activeTab === "settings" ? "default" : "outline"}
          onClick={() => setActiveTab("settings")}
        >
          Manage Account
        </Button>
      </div>

      {activeTab === "profile" && (
        <form
          onSubmit={handleProfileSubmit}
          className="rounded-lg bg-gray-50 p-8"
        >
          <div
            className={`space-y-8 transition-all duration-200 ${isLoading ? "pointer-events-none opacity-50 blur-sm" : ""
              }`}
          >
            <div>
              <label className="mb-2 block text-base font-medium text-gray-700">
                Profile Picture
              </label>
              <ProfilePictureUpload
                currentImage={me?.image}
                userName={me?.name}
              />
            </div>

            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-base font-medium text-gray-700"
              >
                Your Full Name
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="h-12 w-full rounded-full border-gray-200 px-6 text-base shadow-none"
              />
            </div>

            <div>
              <label
                htmlFor="firstName"
                className="mb-2 block text-base font-medium text-gray-700"
              >
                First Name
              </label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="h-12 w-full rounded-full border-gray-200 px-6 text-base shadow-none"
              />
            </div>

            <div>
              <label
                htmlFor="orgName"
                className="mb-2 block text-base font-medium text-gray-700"
              >
                Organization
              </label>
              <Input
                id="orgName"
                name="orgName"
                value={formData.orgName}
                onChange={handleChange}
                className="h-12 w-full rounded-full border-gray-200 px-6 text-base shadow-none"
              />
            </div>

            <div>
              <label
                htmlFor="orgUrl"
                className="mb-2 block text-base font-medium text-gray-700"
              >
                Organization Domain or URL
              </label>
              <Input
                id="orgUrl"
                name="orgUrl"
                value={formData.orgUrl}
                onChange={handleChange}
                placeholder="example.com or https://example.com"
                className="h-12 w-full rounded-full border-gray-200 px-6 text-base shadow-none"
              />
            </div>

            <div>
              <label
                htmlFor="location"
                className="mb-2 block text-base font-medium text-gray-700"
              >
                Location
              </label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="h-12 w-full rounded-full border-gray-200 px-6 text-base shadow-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-base font-medium text-gray-700">
                Research Focus{" "}
                {selectedInterests.length < 3 && (
                  <span className="ml-1 text-sm text-amber-600">
                    (Select at least 3 for a complete profile)
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-4">
                {interests.map((interest) => (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => toggleInterest(interest.id)}
                    className={`relative rounded-[16px] px-6 py-4 text-center text-lg transition-all ${selectedInterests.includes(interest.id)
                      ? "border border-blue-200 bg-gradient-to-r from-[rgba(110,191,244,0.26)] to-[rgba(113,214,247,0.1248)] font-semibold text-[#484139] shadow-[1px_3px_20px_-8px_rgba(0,0,0,0.41)] backdrop-blur-[42.8px] hover:translate-y-[-2px] hover:shadow-[1px_5px_25px_-6px_rgba(0,0,0,0.5)]"
                      : "bg-[rgba(205,198,190,0.26)] font-medium text-[#484139] backdrop-blur-[42.8px] hover:translate-y-[-2px] hover:bg-[rgba(205,198,190,0.4)] hover:shadow-md"
                      }`}
                  >
                    {interest.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            {formChanged && (
              <Button
                type="submit"
                variant="default"
                disabled={isSubmitting || !formChanged}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        </form>
      )}

      {activeTab === "notifications" && (
        <form
          onSubmit={handleNotificationsSubmit}
          className="rounded-lg bg-gray-50 p-8"
        >
          <div
            className={`space-y-6 transition-all duration-200 ${isLoading ? "pointer-events-none opacity-50 blur-sm" : ""
              }`}
          >
            <h2 className="mb-4 text-lg font-medium text-gray-700">
              Notification Settings
            </h2>

            <div className="flex items-center justify-between border-b border-gray-200 py-3">
              <div className="flex-1">
                <h3 className="text-base font-medium text-gray-700">
                  Desktop Notifications
                </h3>
              </div>
              <Switch
                checked={notificationPrefs.productUpdates}
                onCheckedChange={() =>
                  handleNotificationToggle("productUpdates")
                }
              />
            </div>

            <div className="flex items-center justify-between border-b border-gray-200 py-3">
              <div className="flex-1">
                <h3 className="text-base font-medium text-gray-700">
                  Email Notifications
                </h3>
              </div>
              <Switch
                checked={notificationPrefs.marketingEmails}
                onCheckedChange={() =>
                  handleNotificationToggle("marketingEmails")
                }
              />
            </div>

            <div className="flex items-center justify-between border-b border-gray-200 py-3">
              <div className="flex-1">
                <h3 className="text-base font-medium text-gray-700">
                  Transaction Emails
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Required emails for your Complēre account
                </p>
              </div>
              <Switch checked={true} disabled />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            {notificationsChanged && (
              <Button
                type="submit"
                variant="default"
                disabled={isSubmitting || !notificationsChanged}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        </form>
      )}
      {activeTab === "settings" && (
        <ManageAccountPage />
      )}
      <div className="mt-8 flex justify-center">
        <Link href="/app">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
