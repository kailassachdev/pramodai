"use client";

import React, { useState, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import { Camera, MapPin, Loader2, Leaf, FlaskConical, SprayCan, Droplet, Sun, AlertCircle, Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { analyzePlant, AnalyzePlantOutput, AnalyzePlantInput } from '@/ai/flows/analyze-plant';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function PlantAnalyzer() {
  const [plantImageDataUri, setPlantImageDataUri] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzePlantOutput | null>(null);
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

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
        (error) => {
          console.error("Geolocation error:", error);
          setErrorDialog({ open: true, message: 'Could not retrieve location. Please enable location services and try again.' });
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
          🌿 AgriAssist AI
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

          <div className="mb-8">
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
                  <Sprout className={`w-5 h-5 mr-2 text-green-600`} /> Plant Identification:
                </h3>
                <ul className="list-none text-muted-foreground ml-4 space-y-1">
                  <li>
                    <span className="font-medium text-foreground">Is it a plant?</span> {analysisResult.identification.isPlant ? 'Yes' : 'No'}
                  </li>
                  {analysisResult.identification.isPlant && analysisResult.identification.commonName && (
                    <li>
                      <span className="font-medium text-foreground">Common Name:</span> {analysisResult.identification.commonName}
                    </li>
                  )}
                  {analysisResult.identification.isPlant && analysisResult.identification.latinName && (
                    <li>
                      <span className="font-medium text-foreground">Latin Name:</span> <em className="italic">{analysisResult.identification.latinName}</em>
                    </li>
                  )}
                   {!analysisResult.identification.isPlant && (
                     <li>The image provided does not appear to be a plant.</li>
                   )}
                </ul>
              </div>
            )}

            <AnalysisSection title="Problems" items={analysisResult.problems} icon={Leaf} iconColorClass="text-destructive" />
            <AnalysisSection title="Diseases" items={analysisResult.diseases} icon={FlaskConical} iconColorClass="text-purple-600" />
            <AnalysisSection title="Solutions" items={analysisResult.solutions} icon={Droplet} iconColorClass="text-blue-500" />

            {analysisResult.recommendations && 
             (analysisResult.recommendations.manure?.length ||
              analysisResult.recommendations.fertilizer?.length ||
              analysisResult.recommendations.pesticide?.length) && (
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-foreground flex items-center mb-2 font-headline">
                  <SprayCan className="w-5 h-5 mr-2 text-orange-500" /> Recommendations:
                </h3>
                <ul className="list-disc list-inside text-muted-foreground ml-4 space-y-1">
                  {analysisResult.recommendations.manure && analysisResult.recommendations.manure.length > 0 && (
                    <li>
                      <span className="font-medium text-foreground">Manure:</span> {analysisResult.recommendations.manure.join(', ')}
                    </li>
                  )}
                  {analysisResult.recommendations.fertilizer && analysisResult.recommendations.fertilizer.length > 0 && (
                    <li>
                      <span className="font-medium text-foreground">Fertilizer:</span> {analysisResult.recommendations.fertilizer.join(', ')}
                    </li>
                  )}
                  {analysisResult.recommendations.pesticide && analysisResult.recommendations.pesticide.length > 0 && (
                    <li>
                      <span className="font-medium text-foreground">Pesticide:</span> {analysisResult.recommendations.pesticide.join(', ')}
                    </li>
                  )}
                </ul>
              </div>
            )}
            
            <AnalysisSection title="Vitamin Deficiencies" items={analysisResult.vitaminDeficiencies} icon={Sun} iconColorClass="text-yellow-500" />
            
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
              (analysisResult.identification && !analysisResult.identification.isPlant) && ( // Check if identification exists and it's not a plant
                <p className="text-center text-muted-foreground">No plant-related issues identified. Please upload an image of a plant for analysis.</p>
              )
            }
             { /* If it is a plant and no issues, then suggest it might be healthy */
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
                <p className="text-center text-muted-foreground">No specific issues identified. Your plant might be healthy!</p>
              )
            }
          </CardContent>
        </Card>
      )}
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} AgriAssist AI. Powered by GenAI.</p>
      </footer>
    </div>
  );
}
