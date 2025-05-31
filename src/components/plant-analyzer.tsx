
"use client";

import React, { useState, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import { Camera, MapPin, Loader2, Leaf, FlaskConical, SprayCan, Droplet, Sun, AlertCircle, Sprout, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { analyzePlant, AnalyzePlantOutput, AnalyzePlantInput } from '@/ai/flows/analyze-plant';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function PlantAnalyzer() {
  const [plantImageDataUri, setPlantImageDataUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzePlantOutput | null>(null);
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [language, setLanguage] = useState<'english' | 'malayalam'>('english');

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setErrorDialog({ open: false, message: '' });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPlantImageDataUri(reader.result as string);
      };
      reader.onerror = () => {
        setErrorDialog({ open: true, message: 'Failed to read image file.' });
        setPlantImageDataUri(null);
      };
      reader.readAsDataURL(file);
    } else {
      setPlantImageDataUri(null);
    }
  };

  const handleGetLocation = () => {
    setErrorDialog({ open: false, message: '' });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error: GeolocationPositionError) => {
          console.error("Geolocation error code:", error.code);
          console.error("Geolocation error message:", error.message);
          let userMessage = 'Could not retrieve location. Please enable location services and try again.';
          if (error.code === error.PERMISSION_DENIED) {
            userMessage = 'Location access denied. Please enable location permissions in your browser settings.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            userMessage = 'Location information is unavailable. Please try again later or check your device settings.';
          } else if (error.code === error.TIMEOUT) {
            userMessage = 'Getting location timed out. Please try again.';
          }
          setErrorDialog({ open: true, message: userMessage });
          setLocation(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setErrorDialog({ open: true, message: 'Geolocation is not supported by your browser.' });
      setLocation(null);
    }
  };

  const handleAnalyzePlant = async () => {
    if (!plantImageDataUri) {
      setErrorDialog({ open: true, message: 'Please upload a plant photo.' });
      return;
    }
    if (!location) {
      setErrorDialog({ open: true, message: 'Please get your geographical location.' });
      return;
    }

    setIsLoading(true);
    setAnalysisResult(null);
    setErrorDialog({ open: false, message: '' });

    try {
      const input: AnalyzePlantInput = {
        photoDataUri: plantImageDataUri,
        latitude: location.lat,
        longitude: location.lon,
        language: language,
      };
      const result = await analyzePlant(input);
      setAnalysisResult(result);
    } catch (error) {
      console.error("Error analyzing plant:", error);
      let errorMessage = 'An error occurred during analysis. Please try again.';
      if (error instanceof Error) {
        errorMessage = `Analysis failed: ${error.message}. Check console for details.`;
      }
      setErrorDialog({ open: true, message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };
  
  const AnalysisSection: React.FC<{title: string; items: string[] | undefined; icon: React.ElementType; iconColorClass: string }> = ({ title, items, icon: Icon, iconColorClass }) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mb-4">
        <h3 className={`text-xl font-semibold text-foreground flex items-center mb-2 font-headline`}>
          <Icon className={`w-5 h-5 mr-2 ${iconColorClass}`} /> {title}:
        </h3>
        <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center font-body">
      <AlertDialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog(prev => ({...prev, open}))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center font-headline">
              <AlertCircle className="text-destructive mr-2" /> Error
            </AlertDialogTitle>
            <AlertDialogDescription>
              {errorDialog.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorDialog({ open: false, message: '' })}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-primary mb-2 font-headline drop-shadow-md">
          🌿 Pramod AI
        </h1>
        <p className="text-lg text-muted-foreground">Your personal plant health expert.</p>
      </header>

      <Card className="p-6 rounded-2xl shadow-xl max-w-3xl w-full mb-8">
        <CardHeader className="p-0 mb-6">
          <CardTitle className="text-2xl font-bold text-primary text-center font-headline">Diagnose Your Plant</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="mb-6">
            <label htmlFor="plant-photo" className="block text-lg font-medium text-foreground mb-2 font-headline">
              1. Upload Plant Photo
            </label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="plant-photo"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition duration-300"
              >
                {plantImageDataUri ? (
                  <Image
                    src={plantImageDataUri}
                    alt="Plant Preview"
                    width={176} 
                    height={176} 
                    className="max-h-44 object-contain rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Camera className="w-10 h-10 text-accent mb-3" />
                    <p className="mb-2 text-sm text-muted-foreground text-center">
                      <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, HEIC (MAX. 5MB)</p>
                  </div>
                )}
                <Input
                  id="plant-photo"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>
            {plantImageDataUri && (
              <p className="mt-2 text-sm text-primary text-center">Photo uploaded successfully!</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-lg font-medium text-foreground mb-2 font-headline">
              2. Get Geographical Location
            </label>
            <Button
              onClick={handleGetLocation}
              variant={location ? "secondary" : "default"}
              className="w-full flex items-center justify-center px-6 py-3 text-base font-medium rounded-md shadow-md"
            >
              <MapPin className="w-5 h-5 mr-2" />
              {location ? 'Location Retrieved!' : 'Get My Current Location'}
            </Button>
            {location && (
              <p className="mt-2 text-sm text-muted-foreground text-center">
                Latitude: {location.lat.toFixed(4)}, Longitude: {location.lon.toFixed(4)}
              </p>
            )}
          </div>

          <div className="mb-6 flex items-center space-x-2 justify-center">
            <Switch
              id="language-switch"
              checked={language === 'malayalam'}
              onCheckedChange={(checked) => setLanguage(checked ? 'malayalam' : 'english')}
            />
            <Label htmlFor="language-switch" className="text-foreground flex items-center">
              <Languages className="w-4 h-4 mr-2"/> Show results in Malayalam
            </Label>
          </div>


          <Button
            onClick={handleAnalyzePlant}
            disabled={isLoading || !plantImageDataUri || !location}
            className="w-full flex items-center justify-center px-6 py-3 text-lg font-semibold rounded-md shadow-lg"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2 h-6 w-6" />
                Analyzing...
              </>
            ) : (
              <>
                <Leaf className="w-6 h-6 mr-2" />
                Analyze Plant
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysisResult && (
        <Card className="p-6 rounded-2xl shadow-xl max-w-3xl w-full">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-2xl font-bold text-primary text-center font-headline">Analysis Results</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {analysisResult.identification && (
              <div className="mb-4">
                <h3 className={`text-xl font-semibold text-foreground flex items-center mb-2 font-headline`}>
                  <Sprout className={`w-5 h-5 mr-2 text-green-600`} /> {language === 'malayalam' ? 'സസ്യ തിരിച്ചറിയൽ' : 'Plant Identification'}:
                </h3>
                <ul className="list-none text-muted-foreground ml-4 space-y-1">
                  <li>
                    <span className="font-medium text-foreground">{language === 'malayalam' ? ' ഇതൊരു സസ്യമാണോ?' : 'Is it a plant?'}</span> {analysisResult.identification.isPlant ? (language === 'malayalam' ? 'അതെ' : 'Yes') : (language === 'malayalam' ? 'അല്ല' : 'No')}
                  </li>
                  {analysisResult.identification.isPlant && analysisResult.identification.commonName && (
                    <li>
                      <span className="font-medium text-foreground">{language === 'malayalam' ? 'സാധാരണ പേര്:' : 'Common Name:'}</span> {analysisResult.identification.commonName}
                    </li>
                  )}
                  {analysisResult.identification.isPlant && analysisResult.identification.latinName && (
                    <li>
                      <span className="font-medium text-foreground">{language === 'malayalam' ? 'ലാറ്റിൻ പേര്:' : 'Latin Name:'}</span> <em className="italic">{analysisResult.identification.latinName}</em>
                    </li>
                  )}
                   {!analysisResult.identification.isPlant && (
                     <li>{language === 'malayalam' ? 'നൽകിയിട്ടുള്ള ചിത്രം ഒരു സസ്യമായി തോന്നുന്നില്ല.' : 'The image provided does not appear to be a plant.'}</li>
                   )}
                </ul>
              </div>
            )}

            <AnalysisSection title={language === 'malayalam' ? "പ്രശ്നങ്ങൾ" : "Problems"} items={analysisResult.problems} icon={Leaf} iconColorClass="text-destructive" />
            <AnalysisSection title={language === 'malayalam' ? "രോഗങ്ങൾ" : "Diseases"} items={analysisResult.diseases} icon={FlaskConical} iconColorClass="text-purple-600" />
            <AnalysisSection title={language === 'malayalam' ? "പരിഹാരങ്ങൾ" : "Solutions"} items={analysisResult.solutions} icon={Droplet} iconColorClass="text-blue-500" />

            {analysisResult.recommendations && 
             (analysisResult.recommendations.manure?.length ||
              analysisResult.recommendations.fertilizer?.length ||
              analysisResult.recommendations.pesticide?.length) && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-foreground flex items-center mb-2 font-headline">
                  <SprayCan className="w-5 h-5 mr-2 text-orange-500" /> {language === 'malayalam' ? "ശുപാർശകൾ" : "Recommendations"}:
                </h3>
                <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                  {analysisResult.recommendations.manure && analysisResult.recommendations.manure.length > 0 && (
                    <li>
                      <span className="font-medium text-foreground">{language === 'malayalam' ? "ചാണകം:" : "Manure:"}</span> {analysisResult.recommendations.manure.join(', ')}
                    </li>
                  )}
                  {analysisResult.recommendations.fertilizer && analysisResult.recommendations.fertilizer.length > 0 && (
                    <li>
                      <span className="font-medium text-foreground">{language === 'malayalam' ? "വളം:" : "Fertilizer:"}</span> {analysisResult.recommendations.fertilizer.join(', ')}
                    </li>
                  )}
                  {analysisResult.recommendations.pesticide && analysisResult.recommendations.pesticide.length > 0 && (
                    <li>
                      <span className="font-medium text-foreground">{language === 'malayalam' ? "കീടനാശിനി:" : "Pesticide:"}</span> {analysisResult.recommendations.pesticide.join(', ')}
                    </li>
                  )}
                </ul>
              </div>
            )}
            
            <AnalysisSection title={language === 'malayalam' ? "വിറ്റാമിൻ കുറവുകൾ" : "Vitamin Deficiencies"} items={analysisResult.vitaminDeficiencies} icon={Sun} iconColorClass="text-yellow-500" />
            
            {
              (!analysisResult.problems || analysisResult.problems.length === 0) &&
              (!analysisResult.diseases || analysisResult.diseases.length === 0) &&
              (!analysisResult.solutions || analysisResult.solutions.length === 0) &&
              (!analysisResult.recommendations || (
                (!analysisResult.recommendations.manure || analysisResult.recommendations.manure.length === 0) &&
                (!analysisResult.recommendations.fertilizer || analysisResult.recommendations.fertilizer.length === 0) &&
                (!analysisResult.recommendations.pesticide || analysisResult.recommendations.pesticide.length === 0)
              )) &&
              (!analysisResult.vitaminDeficiencies || analysisResult.vitaminDeficiencies.length === 0) &&
              (analysisResult.identification && !analysisResult.identification.isPlant) && ( 
                <p className="text-center text-muted-foreground">{language === 'malayalam' ? 'സസ്യങ്ങളുമായി ബന്ധപ്പെട്ട പ്രശ്‌നങ്ങളൊന്നും കണ്ടെത്തിയില്ല. വിശകലനത്തിനായി ഒരു സസ്യത്തിന്റെ ചിത്രം അപ്‌ലോഡ് ചെയ്യുക.' : 'No plant-related issues identified. Please upload an image of a plant for analysis.'}</p>
              )
            }
             { 
              analysisResult.identification && analysisResult.identification.isPlant &&
              (!analysisResult.problems || analysisResult.problems.length === 0) &&
              (!analysisResult.diseases || analysisResult.diseases.length === 0) &&
              (!analysisResult.solutions || analysisResult.solutions.length === 0) &&
              (!analysisResult.recommendations || (
                (!analysisResult.recommendations.manure || analysisResult.recommendations.manure.length === 0) &&
                (!analysisResult.recommendations.fertilizer || analysisResult.recommendations.fertilizer.length === 0) &&
                (!analysisResult.recommendations.pesticide || analysisResult.recommendations.pesticide.length === 0)
              )) &&
              (!analysisResult.vitaminDeficiencies || analysisResult.vitaminDeficiencies.length === 0) && (
                <p className="text-center text-muted-foreground">{language === 'malayalam' ? 'പ്രത്യേകിച്ച് പ്രശ്‌നങ്ങളൊന്നും കണ്ടെത്തിയില്ല. നിങ്ങളുടെ സസ്യം തികഞ്ഞ അവസ്ഥയിലാണെന്ന് തോന്നുന്നു!' : 'No specific issues identified. Your plant appears to be in perfect condition!'}</p>
              )
            }
          </CardContent>
        </Card>
      )}
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Pramod AI. Powered by GenAI.</p>
      </footer>
    </div>
  );
}

