"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Calendar, MapPin, Users, Plus, Trash2, Edit2 } from "lucide-react"
import Link from "next/link"
import { Home, BookOpen, User, Menu, X } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import dynamic from "next/dynamic"

// Load LocationPicker only on the client
const LocationPicker = dynamic(
  () => import("@/components/location-picker").then((mod) => mod.LocationPicker),
  { ssr: false }
)

interface JoinRequest {
  userId: string
  userName: string
  userEmail: string
  status: "pending" | "approved" | "rejected"
}

interface MyEvent {
  id: string
  eventTitle: string
  description: string
  date: string
  time: string
  location: string
  latitude?: number
  longitude?: number
  attendees: string[]
  joinRequests: JoinRequest[]
  maxAttendees: number
  createdBy: string
  dateCreated: string
}

// Simple Location Display Component
function LocationDisplay({
  location,
  latitude,
  longitude,
}: {
  location: string
  latitude?: number
  longitude?: number
}) {
  const handleOpenInMaps = () => {
    if (latitude && longitude) {
      window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, "_blank")
    } else {
      window.open(`https://www.google.com/maps?q=${encodeURIComponent(location)}`, "_blank")
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Event Location</h4>
        <Button onClick={handleOpenInMaps} variant="outline" size="sm" className="gap-2 bg-transparent">
          <MapPin className="w-4 h-4" />
          Open in Maps
        </Button>
      </div>

      <div className="w-full h-32 rounded-lg border border-gray-300 bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-8 h-8 text-primary mx-auto mb-1" />
          <p className="text-xs text-gray-600">Location: {location}</p>
          {latitude && longitude && (
            <p className="text-xs text-gray-500 mt-1">
              Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </p>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{location}</p>
    </div>
  )
}

export default function ElderEventPage() {
  const { toast } = useToast()
  const [events, setEvents] = useState<MyEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [eventTitle, setEventTitle] = useState("")
  const [eventDescription, setEventDescription] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventTime, setEventTime] = useState("")
  const [eventLocation, setEventLocation] = useState("")
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [maxAttendees, setMaxAttendees] = useState(50)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Load events from localStorage or API
    const loadEvents = () => {
      try {
        const savedEvents = localStorage.getItem("elderEvents")
        if (savedEvents) {
          setEvents(JSON.parse(savedEvents))
        }
      } catch (error) {
        console.error("Failed to load events:", error)
      } finally {
        setLoadingEvents(false)
      }
    }
    loadEvents()
  }, [])

  // Save events to localStorage whenever they change
  useEffect(() => {
    if (!loadingEvents) {
      localStorage.setItem("elderEvents", JSON.stringify(events))
    }
  }, [events, loadingEvents])

  const resetEventForm = () => {
    setEventTitle("")
    setEventDescription("")
    setEventDate("")
    setEventTime("")
    setEventLocation("")
    setLatitude(null)
    setLongitude(null)
    setMaxAttendees(50)
  }

  const startEditEvent = (event: MyEvent) => {
    setEventTitle(event.eventTitle)
    setEventDescription(event.description)
    setEventDate(event.date)
    setEventTime(event.time)
    setEventLocation(event.location)
    setLatitude(event.latitude || null)
    setLongitude(event.longitude || null)
    setMaxAttendees(event.maxAttendees)
    setEditingEventId(event.id)
    setShowEditDialog(true)
  }

  const handleLocationSelect = (address: string, lat?: number, lng?: number) => {
    setEventLocation(address)
    setLatitude(lat || null)
    setLongitude(lng || null)
  }

  const handleCreateEvent = async () => {
    if (!eventTitle.trim() || !eventDescription.trim() || !eventDate || !eventTime || !eventLocation.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const newEvent: MyEvent = {
        id: Date.now().toString(),
        eventTitle,
        description: eventDescription,
        date: eventDate,
        time: eventTime,
        location: eventLocation,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        attendees: [],
        joinRequests: [],
        maxAttendees,
        createdBy: "current-user",
        dateCreated: new Date().toISOString(),
      }

      setEvents([...events, newEvent])

      toast({
        title: "Success",
        description: "Event created successfully",
      })

      resetEventForm()
      setShowCreateDialog(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not create event",
        variant: "destructive",
      })
    }
  }

  const handleEditEvent = async () => {
    if (!editingEventId) return

    try {
      setEvents(
        events.map((e) =>
          e.id === editingEventId
            ? {
                ...e,
                eventTitle,
                description: eventDescription,
                date: eventDate,
                time: eventTime,
                location: eventLocation,
                latitude: latitude || undefined,
                longitude: longitude || undefined,
                maxAttendees,
              }
            : e
        )
      )

      toast({
        title: "Success",
        description: "Event updated successfully",
      })

      resetEventForm()
      setShowEditDialog(false)
      setEditingEventId(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not update event",
        variant: "destructive",
      })
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return

    try {
      setEvents(events.filter((e) => e.id !== eventId))
      toast({
        title: "Success",
        description: "Event deleted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not delete event",
        variant: "destructive",
      })
    }
  }

  if (loadingEvents) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Loading events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Navigation Bar for Mobile */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-emerald-800 hover:bg-emerald-50 rounded-full"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <img src="/ease.jpg" alt="ElderEase Logo" className="w-8 h-8 rounded-lg object-cover" />
            <h2 className="text-lg font-bold text-emerald-800">ElderEase</h2>
          </div>
        </div>
        <h1 className="text-xl font-bold text-emerald-800">Events</h1>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between p-6 border-b bg-white">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <img src="/ease.jpg" alt="ElderEase Logo" className="w-10 h-10 rounded-lg object-cover" />
            <div>
              <h2 className="text-xl font-bold text-emerald-800">ElderEase</h2>
              <p className="text-sm text-muted-foreground">Community Events Platform</p>
            </div>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4" />
          Create Event
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed md:relative inset-y-0 left-0 z-40 w-64 md:w-72 flex flex-col shadow-2xl h-screen transition-transform duration-300 ease-in-out transform ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:flex`}
        style={{
          background: "linear-gradient(180deg, #047857, #059669)",
        }}
      >
        {/* Mobile Header inside Sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-emerald-700 md:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <img src="/ease.jpg" alt="ElderEase Logo" className="w-8 h-8 rounded-lg object-cover" />
            </div>
            <h2 className="text-lg font-bold text-white">ElderEase</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Desktop Logo */}
        <div className="hidden md:block p-6 border-b border-emerald-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm ring-2 ring-white/20">
              <img src="/ease.jpg" alt="ElderEase Logo" className="w-10 h-10 rounded-lg object-cover" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">ElderEase</h2>
              <p className="text-xs text-emerald-200">Community Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {[
              { icon: Home, label: "Home", href: "/elder/home", active: false },
              { icon: BookOpen, label: "Tutorial", href: "/elder/tutorial", active: false },
              { icon: Calendar, label: "Event", href: "/elder/event", active: true },
              { icon: User, label: "Profile", href: "/elder/profile", active: false },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                    item.active
                      ? "bg-white text-emerald-800 shadow-lg"
                      : "text-emerald-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.active && <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="hidden md:flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Events</h1>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4" />
              Create Event
            </Button>
          </div>

          <div className="md:hidden mb-6">
            <Button 
              onClick={() => setShowCreateDialog(true)} 
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4" />
              Create New Event
            </Button>
          </div>

          {events.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No events yet</h3>
                <p className="text-muted-foreground mb-4">Create your first event to bring the community together!</p>
                <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Your First Event
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow border-emerald-100 hover:border-emerald-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg md:text-xl">{event.eventTitle}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => startEditEvent(event)}
                          className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {event.date} at {event.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {event.attendees.length}/{event.maxAttendees} attendees
                        </span>
                      </div>
                    </div>
                    <LocationDisplay location={event.location} latitude={event.latitude} longitude={event.longitude} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create & Edit Dialogs */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">Create New Event</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Organize a community event for everyone to join
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Title *</label>
              <Input
                placeholder="What's the event about?"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                placeholder="Describe the event in detail..."
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                className="min-h-24 resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date *</label>
                <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time *</label>
                <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location *</label>
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                initialAddress={eventLocation}
                initialLat={latitude || undefined}
                initialLng={longitude || undefined}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Attendees</label>
              <Input
                type="number"
                min="1"
                value={maxAttendees}
                onChange={(e) => setMaxAttendees(Number.parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button 
                onClick={handleCreateEvent} 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={!eventTitle.trim() || !eventDescription.trim() || !eventDate || !eventTime || !eventLocation.trim()}
              >
                Create Event
              </Button>
              <Button onClick={() => setShowCreateDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">Edit Event</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">Update your event details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Event Title *</label>
              <Input
                placeholder="What's the event about?"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <Textarea
                placeholder="Describe the event in detail..."
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                className="min-h-24 resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date *</label>
                <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time *</label>
                <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location *</label>
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                initialAddress={eventLocation}
                initialLat={latitude || undefined}
                initialLng={longitude || undefined}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Attendees</label>
              <Input
                type="number"
                min="1"
                value={maxAttendees}
                onChange={(e) => setMaxAttendees(Number.parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button 
                onClick={handleEditEvent} 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={!eventTitle.trim() || !eventDescription.trim() || !eventDate || !eventTime || !eventLocation.trim()}
              >
                Save Changes
              </Button>
              <Button onClick={() => setShowEditDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}