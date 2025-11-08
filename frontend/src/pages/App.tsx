import React from "react";
import { Cloud, Droplets, Wind, ShoppingCart, BookOpen, Newspaper, CheckSquare, Sun, Thermometer, Search, Plus, Bell, ExternalLink, MapPin, Loader2, Trash2 } from "lucide-react";
import brain from "brain";
import type { WeatherResponse, NewsResponse, DiseasesResponse, SuppliersResponse, Task } from "types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// Declare Razorpay on window object
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function App() {
  const [language, setLanguage] = React.useState<"en" | "hi">("en");
  const [weather, setWeather] = React.useState<WeatherResponse | null>(null);
  const [news, setNews] = React.useState<NewsResponse | null>(null);
  const [diseases, setDiseases] = React.useState<DiseasesResponse | null>(null);
  const [suppliers, setSuppliers] = React.useState<SuppliersResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [locationError, setLocationError] = React.useState<string | null>(null);
  
  // Task management state
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [newTaskTime, setNewTaskTime] = React.useState("");
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [taskLoading, setTaskLoading] = React.useState(false);

  // Fetch weather based on user's location
  React.useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await brain.get_weather({ lat: latitude, lon: longitude });
            
            if (response.status === 429) {
              console.log("Weather API rate limit reached. Using demo data.");
              // Use demo data when API rate limit is hit
              setWeather({
                current: {
                  temperature: 28,
                  humidity: 65,
                  rainfall: 0,
                  description: "Partly Cloudy",
                  icon: "02d",
                  location: "Your Location"
                },
                forecast: [
                  { day: "Mon", temp: 26, description: "Sunny", icon: "01d" },
                  { day: "Tue", temp: 27, description: "Partly Cloudy", icon: "02d" },
                  { day: "Wed", temp: 28, description: "Cloudy", icon: "03d" },
                  { day: "Thu", temp: 29, description: "Sunny", icon: "01d" },
                  { day: "Fri", temp: 30, description: "Partly Cloudy", icon: "02d" },
                  { day: "Sat", temp: 31, description: "Sunny", icon: "01d" },
                  { day: "Sun", temp: 32, description: "Hot", icon: "01d" }
                ]
              });
              setLocationError("Using demo weather data (API limit reached)");
              setLoading(false);
              return;
            }
            
            if (!response.ok) {
              throw new Error(`Weather API returned ${response.status}`);
            }
            
            const data = await response.json();
            setWeather(data);
            setLoading(false);
          } catch (error) {
            console.error("Error fetching weather:", error);
            // Use demo data on any error
            setWeather({
              current: {
                temperature: 28,
                humidity: 65,
                rainfall: 0,
                description: "Partly Cloudy",
                icon: "02d",
                location: "Your Location"
              },
              forecast: [
                { day: "Mon", temp: 26, description: "Sunny", icon: "01d" },
                { day: "Tue", temp: 27, description: "Partly Cloudy", icon: "02d" },
                { day: "Wed", temp: 28, description: "Cloudy", icon: "03d" },
                { day: "Thu", temp: 29, description: "Sunny", icon: "01d" },
                { day: "Fri", temp: 30, description: "Partly Cloudy", icon: "02d" },
                { day: "Sat", temp: 31, description: "Sunny", icon: "01d" },
                { day: "Sun", temp: 32, description: "Hot", icon: "01d" }
              ]
            });
            setLocationError("Using demo weather data");
            setLoading(false);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          // Use demo data when location is denied
          setWeather({
            current: {
              temperature: 28,
              humidity: 65,
              rainfall: 0,
              description: "Partly Cloudy",
              icon: "02d",
              location: "Demo Location"
            },
            forecast: [
              { day: "Mon", temp: 26, description: "Sunny", icon: "01d" },
              { day: "Tue", temp: 27, description: "Partly Cloudy", icon: "02d" },
              { day: "Wed", temp: 28, description: "Cloudy", icon: "03d" },
              { day: "Thu", temp: 29, description: "Sunny", icon: "01d" },
              { day: "Fri", temp: 30, description: "Partly Cloudy", icon: "02d" },
              { day: "Sat", temp: 31, description: "Sunny", icon: "01d" },
              { day: "Sun", temp: 32, description: "Hot", icon: "01d" }
            ]
          });
          setLocationError("Enable location for live weather or view demo data");
          setLoading(false);
        }
      );
    } else {
      setLocationError("Geolocation not supported");
      setLoading(false);
    }
  }, []);

  // Fetch agriculture news
  React.useEffect(() => {
    async function fetchNews() {
      try {
        const response = await brain.get_agriculture_news();
        const data = await response.json();
        setNews(data);
      } catch (error) {
        console.error("Error fetching news:", error);
      }
    }
    fetchNews();
  }, []);

  // Fetch diseases from Firebase
  React.useEffect(() => {
    async function fetchDiseases() {
      try {
        const response = await brain.get_diseases();
        const data = await response.json();
        setDiseases(data);
      } catch (error) {
        console.error("Error fetching diseases:", error);
      }
    }
    fetchDiseases();
  }, []);

  // Fetch suppliers from Firebase
  React.useEffect(() => {
    async function fetchSuppliers() {
      try {
        const response = await brain.get_suppliers();
        const data = await response.json();
        setSuppliers(data);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      }
    }
    fetchSuppliers();
  }, []);

  // Load Razorpay script
  React.useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Fetch tasks from Firebase
  React.useEffect(() => {
    fetchTasks();
  }, []);

  // Fetch all tasks
  const fetchTasks = async () => {
    try {
      const response = await brain.get_tasks();
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  // Add new task
  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !newTaskTime) {
      alert("Please fill in all fields");
      return;
    }

    setTaskLoading(true);
    try {
      await brain.add_task({
        title: newTaskTitle,
        scheduled_time: newTaskTime,
      });
      
      // Refresh tasks
      await fetchTasks();
      
      // Reset form
      setNewTaskTitle("");
      setNewTaskTime("");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding task:", error);
      alert("Failed to add task");
    } finally {
      setTaskLoading(false);
    }
  };

  // Toggle task completion
  const handleToggleTask = async (taskId: string) => {
    try {
      await brain.toggle_task({ taskId });
      await fetchTasks();
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    try {
      await brain.delete_task({ taskId });
      await fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Handle Razorpay payment
  const handlePayment = (itemName: string, amount: number) => {
    if (!window.Razorpay) {
      alert("Payment gateway is loading. Please try again.");
      return;
    }

    const RAZORPAY_KEY_ID = "rzp_test_RTJjsMFcmc9dfZ";

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: amount * 100, // Amount in paise
      currency: "INR",
      name: "AgroWorld Marketplace",
      description: itemName,
      image: "",
      handler: function (response: any) {
        alert(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);
      },
      prefill: {
        name: "",
        email: "",
        contact: "",
      },
      theme: {
        color: "#16a34a",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  // Get weather icon component
  const getWeatherIcon = (icon?: string) => {
    if (!icon) return <Sun className="w-5 h-5 text-orange-500" />;
    
    // Map OpenWeather icons to appropriate components
    if (icon.includes("01")) return <Sun className="w-5 h-5 text-orange-500" />;
    if (icon.includes("02") || icon.includes("03") || icon.includes("04")) return <Cloud className="w-5 h-5 text-gray-500" />;
    if (icon.includes("09") || icon.includes("10")) return <Droplets className="w-5 h-5 text-blue-500" />;
    return <Sun className="w-5 h-5 text-orange-500" />;
  };

  const text = {
    en: {
      title: "CropHelp",
      subtitle: "Your Farming Assistant",
      climate: "Climate & Weather",
      marketplace: "Marketplace",
      knowledge: "Knowledge Base",
      news: "Agriculture News",
      tasks: "My Tasks",
      temp: "Temperature",
      humidity: "Humidity",
      rainfall: "Rainfall",
      forecast: "7-Day Forecast",
      seeds: "Seeds & Supplies",
      transport: "Transport Services",
      crops: "Crop Guidance",
      diseases: "Plant Diseases",
      practices: "Best Practices",
      latest: "Latest Updates",
      today: "Today's Tasks",
      addTask: "Add Task",
      buyNow: "Buy Now",
      loading: "Loading weather...",
    },
    hi: {
      title: "एग्रोवर्ल्ड",
      subtitle: "आपका खेती सहायक",
      climate: "जलवायु और मौसम",
      marketplace: "बाज़ार",
      knowledge: "ज्ञान केंद्र",
      news: "कृषि समाचार",
      tasks: "मेरे कार्य",
      temp: "तापमान",
      humidity: "नमी",
      rainfall: "वर्षा",
      forecast: "7-दिन का पूर्वानुमान",
      seeds: "बीज और आपूर्ति",
      transport: "परिवहन सेवाएं",
      crops: "फसल मार्गदर्शन",
      diseases: "पौधों के रोग",
      practices: "सर्वोत्तम तरीके",
      latest: "नवीनतम अपडेट",
      today: "आज के कार्य",
      addTask: "कार्य जोड़ें",
      buyNow: "अभी खरीदें",
      loading: "मौसम लोड हो रहा है...",
    },
  };

  const t = text[language];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-600 dark:bg-green-700 flex items-center justify-center">
                <Sun className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t.title}</h1>
                <p className="text-sm text-muted-foreground">{t.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setLanguage(language === "en" ? "hi" : "en")}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
              >
                {language === "en" ? "हिंदी" : "English"}
              </button>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Climate & Weather Section */}
        <section className="bg-card rounded-xl border border-border p-6">
          <a 
            href="https://mausam.imd.gov.in/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2 hover:text-green-600 dark:hover:text-green-500 transition-colors w-fit"
          >
            <Cloud className="w-5 h-5 text-green-600 dark:text-green-500" />
            {t.climate}
            <ExternalLink className="w-4 h-4" />
          </a>
          
          {weather?.current && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <MapPin className="w-4 h-4" />
              <span>{weather.current.location}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              <span className="ml-3 text-muted-foreground">{t.loading}</span>
            </div>
          ) : locationError ? (
            <div className="text-center py-8 text-muted-foreground">
              {locationError}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <Thermometer className="w-6 h-6 text-orange-600 dark:text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t.temp}</p>
                      <p className="text-2xl font-bold text-foreground">{weather?.current.temperature || 28}°C</p>
                      {weather?.current.description && (
                        <p className="text-xs text-muted-foreground">{weather.current.description}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Droplets className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t.humidity}</p>
                      <p className="text-2xl font-bold text-foreground">{weather?.current.humidity || 65}%</p>
                    </div>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                      <Wind className="w-6 h-6 text-cyan-600 dark:text-cyan-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t.rainfall}</p>
                      <p className="text-2xl font-bold text-foreground">{weather?.current.rainfall || 0}mm</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm font-medium text-muted-foreground mb-3">{t.forecast}</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {weather?.forecast && weather.forecast.length > 0 ? (
                    weather.forecast.map((day, i) => (
                      <div key={i} className="flex-shrink-0 bg-muted/50 rounded-lg p-3 min-w-[80px] text-center border border-border">
                        <p className="text-xs text-muted-foreground mb-1">{day.day}</p>
                        {getWeatherIcon(day.icon)}
                        <p className="text-sm font-semibold text-foreground mt-1">{day.temp}°C</p>
                      </div>
                    ))
                  ) : (
                    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                      <div key={day} className="flex-shrink-0 bg-muted/50 rounded-lg p-3 min-w-[80px] text-center border border-border">
                        <p className="text-xs text-muted-foreground mb-1">{day}</p>
                        <Sun className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                        <p className="text-sm font-semibold text-foreground">{26 + i}°C</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </section>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Marketplace */}
          <section className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-green-600 dark:text-green-500" />
              {t.marketplace}
            </h2>
            <div className="space-y-3">
              {/* Display suppliers from Firebase */}
              {suppliers?.suppliers && suppliers.suppliers.length > 0 ? (
                suppliers.suppliers.slice(0, 3).map((supplier) => (
                  <div key={supplier.id} className="bg-muted/50 rounded-lg p-4 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">{supplier.name}</h3>
                        {supplier.location && (
                          <p className="text-sm text-muted-foreground">📍 {supplier.location}</p>
                        )}
                        {supplier.contact && (
                          <p className="text-sm text-muted-foreground mt-1">📞 {supplier.contact}</p>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => handlePayment(supplier.name, 500)}
                      className="w-full py-2 rounded-lg bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 text-white font-medium transition-colors"
                    >
                      {t.buyNow}
                    </button>
                  </div>
                ))
              ) : (
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{t.seeds}</h3>
                      <p className="text-sm text-muted-foreground">Premium quality seeds for better yield</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-500 mt-2">₹500/kg</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handlePayment("Premium Seeds Package", 500)}
                    className="w-full py-2 rounded-lg bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 text-white font-medium transition-colors"
                  >
                    {t.buyNow}
                  </button>
                </div>
              )}
              <a 
                href="https://kisansabha.in/Agri-Logistics.aspx" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-muted/50 rounded-lg p-4 border border-border hover:border-green-600 dark:hover:border-green-500 transition-colors cursor-pointer block"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{t.transport}</h3>
                    <p className="text-sm text-muted-foreground">Find transporters for your produce and equipment</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
                </div>
              </a>
            </div>
          </section>

          {/* Knowledge Base */}
          <section className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-600 dark:text-green-500" />
              {t.knowledge}
            </h2>
            <div className="space-y-3">
              <a 
                href="https://icar.org.in/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-muted/50 rounded-lg p-4 border border-border hover:border-green-600 dark:hover:border-green-500 transition-colors cursor-pointer block"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{t.crops}</h3>
                    <p className="text-sm text-muted-foreground">Learn about different crops and growing techniques</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
                </div>
              </a>
              
              {/* Display diseases from Firebase */}
              {diseases?.diseases && diseases.diseases.length > 0 ? (
                diseases.diseases.slice(0, 2).map((disease) => (
                  <div key={disease.id} className="bg-muted/50 rounded-lg p-4 border border-border">
                    <h3 className="font-semibold text-foreground mb-1">{disease.name}</h3>
                    {disease.description && (
                      <p className="text-sm text-muted-foreground mb-2">{disease.description}</p>
                    )}
                    {disease.symptoms && (
                      <p className="text-xs text-muted-foreground"><strong>Symptoms:</strong> {disease.symptoms}</p>
                    )}
                    {disease.treatment && (
                      <p className="text-xs text-muted-foreground mt-1"><strong>Treatment:</strong> {disease.treatment}</p>
                    )}
                    {disease.affected_crops && disease.affected_crops.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1"><strong>Affects:</strong> {disease.affected_crops.join(", ")}</p>
                    )}
                  </div>
                ))
              ) : (
                <a 
                  href="https://farmer.gov.in/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-muted/50 rounded-lg p-4 border border-border hover:border-green-600 dark:hover:border-green-500 transition-colors cursor-pointer block"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{t.diseases}</h3>
                      <p className="text-sm text-muted-foreground">Identify and treat common plant diseases</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
                  </div>
                </a>
              )}
              
              <a 
                href="https://freshysites.com/web-design-development/best-agricultural-and-farming-websites/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-muted/50 rounded-lg p-4 border border-border hover:border-green-600 dark:hover:border-green-500 transition-colors cursor-pointer block"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{t.practices}</h3>
                    <p className="text-sm text-muted-foreground">Best farming practices and modern techniques</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
                </div>
              </a>
            </div>
          </section>
        </div>

        {/* Two Column Layout - News & Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agriculture News */}
          <section className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-green-600 dark:text-green-500" />
              {t.news}
            </h2>
            <div className="space-y-3">
              {news?.articles && news.articles.length > 0 ? (
                news.articles.slice(0, 3).map((article, index) => (
                  <a 
                    key={index}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pb-3 border-b border-border last:border-b-0 block hover:bg-muted/50 -mx-2 px-2 py-2 rounded transition-colors"
                  >
                    <p className="text-sm font-medium text-foreground mb-1">{article.title}</p>
                    <p className="text-xs text-muted-foreground">{article.time_ago}</p>
                  </a>
                ))
              ) : (
                <>
                  <div className="pb-3 border-b border-border">
                    <p className="text-sm font-medium text-foreground mb-1">New government subsidy scheme announced</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                  <div className="pb-3 border-b border-border">
                    <p className="text-sm font-medium text-foreground mb-1">Monsoon forecast predicts good rainfall this season</p>
                    <p className="text-xs text-muted-foreground">5 hours ago</p>
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-medium text-foreground mb-1">Organic farming workshops starting next month</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </>
              )}
            </div>
            <a 
              href="https://krishijagran.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-4 w-full py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              {t.latest}
              <ExternalLink className="w-4 h-4" />
            </a>
          </section>

          {/* Task Manager */}
          <section className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-green-600 dark:text-green-500" />
              {t.tasks}
            </h2>
            <div className="space-y-3">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                    <Checkbox 
                      checked={task.completed}
                      onCheckedChange={() => handleToggleTask(task.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(task.scheduled_time).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No tasks yet. Add your first task!</p>
              )}
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 w-full bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  {t.addTask}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Task</DialogTitle>
                  <DialogDescription>
                    Schedule a farming task with a reminder time
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="task-title">Task Title</Label>
                    <Input
                      id="task-title"
                      placeholder="e.g., Water the wheat field"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="task-time">Scheduled Time</Label>
                    <Input
                      id="task-time"
                      type="datetime-local"
                      value={newTaskTime}
                      onChange={(e) => setNewTaskTime(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={handleAddTask} 
                    disabled={taskLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {taskLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Task'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </section>
        </div>
      </main>
    </div>
  );
}
