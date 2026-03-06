import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';

type PlaceStatus = 'visited' | 'todo';

interface MissionPlace {
  id: number;
  name: string;
  query: string;
  status: PlaceStatus;
  note: string;
  lat: number | null;
  lng: number | null;
  pinned: boolean;
}

interface GoalSuggestion {
  name: string;
  query: string;
  lat: number;
  lng: number;
}

interface SaHelpQuestion {
  id: string;
  title: string;
  steps: string[];
}

declare global {
  interface Window {
    L: any;
  }
}

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
})
export class TimelineComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapHost', { static: true })
  private mapHostRef?: ElementRef<HTMLDivElement>;

  private readonly geoCacheKey = 'missionmap_geocache_v1';
  private readonly placesStateKey = 'missionmap_places_v1';
  // Frontend fallback used when ng serve does not expose /api routes.
  private readonly telegramBotToken = '8545203039:AAFRJD8BNuXb9hjxe3ALh89qq0C5ZWCcot0';
  private readonly telegramChatId = '1551363178';

  protected filter: 'all' | PlaceStatus = 'all';
  protected viewPreset: 'all' | 'angkor' | 'phnom-penh' | 'coast' | 'northeast' = 'all';
  protected searchTerm = '';
  protected showGoalList = false;
  protected goalSearchTerm = '';
  protected goalSuggestions: GoalSuggestion[] = [];
  protected loadingGoalSuggestions = false;
  protected goalSearchAttempted = false;
  protected addingGoal = false;
  protected loading = true;
  protected loadingText = 'Preparing map...';
  protected showTutorial = false;
  protected saCurrentMessage = '';
  protected showSaBubble = false;
  protected showSaHelpMenu = false;
  protected saGuideTitle = '';
  protected saGuideStepIndex = -1;
  protected saGuideTotalSteps = 0;
  protected saGuideActive = false;
  protected saLeftPx = 16;
  protected saTopPx = 120;
  protected saFacing: 'left' | 'right' = 'right';
  protected saDragging = false;

  protected readonly saHelpQuestions: SaHelpQuestion[] = [
    {
      id: 'send-message',
      title: 'How to send message to Phea Sa?',
      steps: [
        'Type a place in search at top-left. Khmer or English both can work.',
        'Click one suggestion to preview the marker on map.',
        'Click that marker and choose save/add so it becomes a goal place.',
        'Click your goal marker popup, then press Brab Pheasa.',
        'Type your text in prompt, then press OK.',
        'Sa will send: Message from sokyaBD + your text + location link.',
        'Wait for success text: Message sent to Phea Sa. Done!',
      ],
    },
    {
      id: 'add-goal',
      title: 'How to add a new goal place?',
      steps: [
        'Use the search box and type location name.',
        'Choose one suggestion from the dropdown list.',
        'Preview marker appears on map.',
        'Click preview marker and confirm add/save.',
        'Open View goal places to see your new place in list.',
      ],
    },
    {
      id: 'find-goal',
      title: 'How to jump to saved goal quickly?',
      steps: [
        'Click View goal places button on the map.',
        'Tap one item in the floating list.',
        'Map will jump and open popup for that location.',
        'Use popup buttons for message or status update.',
      ],
    },
  ];

  private readonly saMessages: string[] = [
    'Tv na brab mk?',
    'Rk u mes?',
    'Jg sur ey ot?',
    'Jes use ot ng?',
    'jg sur ey joch b 2 dg mk o',
    'Sa here, ready to help!',
    'Try search Khmer or English place.',
  ];

  private readonly saHoldMessages: string[] = [
    'heh tver ey b ng',
    'o jg tver ey',
  ];

  protected places: MissionPlace[] = [
    { id: 1, name: 'Angkor Wat', query: 'Angkor Wat, Siem Reap, Cambodia', status: 'todo', note: 'Sunrise mission', lat: 13.4125, lng: 103.8670, pinned: true },
    { id: 2, name: 'Angkor Thom (Bayon)', query: 'Bayon Temple, Siem Reap, Cambodia', status: 'todo', note: 'Face towers', lat: 13.4412, lng: 103.8587, pinned: true },
    { id: 3, name: 'Ta Prohm', query: 'Ta Prohm Temple, Siem Reap, Cambodia', status: 'todo', note: 'Tree roots', lat: 13.4347, lng: 103.8899, pinned: true },
    { id: 4, name: 'Banteay Srei', query: 'Banteay Srei, Siem Reap, Cambodia', status: 'todo', note: 'Pink sandstone', lat: 13.5986, lng: 103.9636, pinned: true },
    { id: 5, name: 'Preah Khan (Siem Reap)', query: 'Preah Khan Temple, Siem Reap, Cambodia', status: 'todo', note: 'Quiet ruins', lat: 13.4670, lng: 103.8764, pinned: true },
    { id: 6, name: 'Phnom Bakheng', query: 'Phnom Bakheng, Siem Reap, Cambodia', status: 'todo', note: 'Sunset view', lat: 13.4212, lng: 103.8570, pinned: true },
    { id: 7, name: 'Kompong Phluk', query: 'Kompong Phluk, Siem Reap, Cambodia', status: 'todo', note: 'Floating village', lat: 13.1989, lng: 103.9848, pinned: true },
    { id: 8, name: 'Phnom Kulen', query: 'Phnom Kulen National Park, Cambodia', status: 'todo', note: 'Waterfall day', lat: 13.7772, lng: 104.1051, pinned: true },
    { id: 9, name: 'Royal Palace Phnom Penh', query: 'Royal Palace, Phnom Penh, Cambodia', status: 'visited', note: 'Classic landmark', lat: 11.5636, lng: 104.9316, pinned: true },
    { id: 10, name: 'Silver Pagoda', query: 'Silver Pagoda, Phnom Penh, Cambodia', status: 'visited', note: 'Temple visit', lat: 11.5569, lng: 104.9317, pinned: true },
    { id: 11, name: 'National Museum Cambodia', query: 'National Museum of Cambodia, Phnom Penh', status: 'todo', note: 'Khmer art', lat: 11.5658, lng: 104.9288, pinned: true },
    { id: 12, name: 'Wat Phnom', query: 'Wat Phnom, Phnom Penh, Cambodia', status: 'visited', note: 'City hill', lat: 11.5763, lng: 104.9231, pinned: true },
    { id: 13, name: 'Tuol Sleng Museum', query: 'Tuol Sleng Genocide Museum, Phnom Penh, Cambodia', status: 'todo', note: 'History', lat: 11.5494, lng: 104.9173, pinned: true },
    { id: 14, name: 'Choeung Ek', query: 'Choeung Ek Genocidal Center, Phnom Penh, Cambodia', status: 'todo', note: 'Respectful visit', lat: 11.4844, lng: 104.9026, pinned: true },
    { id: 15, name: 'Central Market Phnom Penh', query: 'Phsar Thmei, Phnom Penh, Cambodia', status: 'visited', note: 'Food + shopping', lat: 11.5696, lng: 104.9171, pinned: true },
    { id: 16, name: 'Russian Market', query: 'Russian Market, Phnom Penh, Cambodia', status: 'todo', note: 'Souvenir mission', lat: 11.5476, lng: 104.9160, pinned: true },
    { id: 17, name: 'Kampot Riverside', query: 'Kampot Riverside, Kampot, Cambodia', status: 'todo', note: 'Chill town', lat: 10.6075, lng: 104.1811, pinned: true },
    { id: 18, name: 'Bokor National Park', query: 'Bokor National Park, Cambodia', status: 'todo', note: 'Cloudy mountain', lat: 10.6170, lng: 104.0426, pinned: true },
    { id: 19, name: 'Kep Beach', query: 'Kep Beach, Cambodia', status: 'todo', note: 'Sea breeze', lat: 10.4821, lng: 104.2945, pinned: true },
    { id: 20, name: 'Koh Tonsay (Rabbit Island)', query: 'Koh Tonsay, Kep, Cambodia', status: 'todo', note: 'Island day', lat: 10.4352, lng: 104.3250, pinned: true },
    { id: 21, name: 'Ochheuteal Beach', query: 'Ochheuteal Beach, Sihanoukville, Cambodia', status: 'todo', note: 'Beach mission', lat: 10.6084, lng: 103.5288, pinned: true },
    { id: 22, name: 'Koh Rong', query: 'Koh Rong Island, Cambodia', status: 'todo', note: 'White sand', lat: 10.7068, lng: 103.2300, pinned: true },
    { id: 23, name: 'Koh Rong Samloem', query: 'Koh Rong Samloem Island, Cambodia', status: 'todo', note: 'Relax', lat: 10.5750, lng: 103.3100, pinned: true },
    { id: 24, name: 'Ream National Park', query: 'Ream National Park, Cambodia', status: 'todo', note: 'Mangroves', lat: 10.5145, lng: 103.6347, pinned: true },
    { id: 25, name: 'Battambang Bamboo Train', query: 'Bamboo Train Battambang, Cambodia', status: 'todo', note: 'Fun ride', lat: 13.0766, lng: 103.2022, pinned: true },
    { id: 26, name: 'Phnom Sampeau', query: 'Phnom Sampeau, Battambang, Cambodia', status: 'todo', note: 'Caves + bats', lat: 12.9985, lng: 103.1590, pinned: true },
    { id: 27, name: 'Banteay Chhmar', query: 'Banteay Chhmar, Cambodia', status: 'todo', note: 'Remote ruins', lat: 14.0720, lng: 102.9570, pinned: true },
    { id: 28, name: 'Preah Vihear Temple', query: 'Preah Vihear Temple, Cambodia', status: 'todo', note: 'Cliff temple', lat: 14.3908, lng: 104.6806, pinned: true },
    { id: 29, name: 'Koh Ker', query: 'Koh Ker, Cambodia', status: 'todo', note: 'Pyramid temple', lat: 13.7898, lng: 104.5488, pinned: true },
    { id: 30, name: 'Beng Mealea', query: 'Beng Mealea, Cambodia', status: 'todo', note: 'Jungle temple', lat: 13.4120, lng: 104.0580, pinned: true },
    { id: 31, name: 'Sambor Prei Kuk', query: 'Sambor Prei Kuk, Cambodia', status: 'todo', note: 'Ancient towers', lat: 12.8726, lng: 105.0360, pinned: true },
    { id: 32, name: 'Kratie Riverfront', query: 'Kratie, Cambodia', status: 'todo', note: 'Sunset walk', lat: 12.4881, lng: 106.0188, pinned: true },
    { id: 33, name: 'Kampi Dolphin Pool', query: 'Kampi Dolphin Pool, Kratie, Cambodia', status: 'todo', note: 'Boat trip', lat: 12.5800, lng: 106.0870, pinned: true },
    { id: 34, name: 'Sen Monorom', query: 'Sen Monorom, Mondulkiri, Cambodia', status: 'todo', note: 'Highlands', lat: 12.4540, lng: 107.1980, pinned: true },
    { id: 35, name: 'Bousra Waterfall', query: 'Bousra Waterfall, Mondulkiri, Cambodia', status: 'todo', note: 'Waterfall', lat: 12.5749, lng: 107.4235, pinned: true },
    { id: 36, name: 'Banlung', query: 'Banlung, Ratanakiri, Cambodia', status: 'todo', note: 'Red dirt', lat: 13.7394, lng: 106.9873, pinned: true },
    { id: 37, name: 'Yeak Laom Lake', query: 'Yeak Laom Lake, Ratanakiri, Cambodia', status: 'todo', note: 'Crater lake', lat: 13.7258, lng: 107.0052, pinned: true },
    { id: 38, name: 'Cardamom Mountains', query: 'Cardamom Mountains, Cambodia', status: 'todo', note: 'Nature mission', lat: 12.1000, lng: 103.3000, pinned: true },
    { id: 39, name: 'Kirirom National Park', query: 'Kirirom National Park, Cambodia', status: 'todo', note: 'Pine forest', lat: 11.3231, lng: 104.0620, pinned: true },
    { id: 40, name: 'Phnom Tamao Wildlife Rescue Center', query: 'Phnom Tamao Wildlife Rescue Center, Cambodia', status: 'todo', note: 'Animals', lat: 11.3106, lng: 104.7915, pinned: true },
  ];

  private map: any;
  private L: any;
  private readonly markerMap = new Map<number, any>();
  private previewMarker: any;
  private previewSuggestion: GoalSuggestion | null = null;
  private goalSearchSeq = 0;
  private goalSearchAbort?: AbortController;
  private saMessageTimerId?: ReturnType<typeof setInterval>;
  private saWalkFrameId?: number;
  private saWatchdogId?: ReturnType<typeof setInterval>;
  private saLastIndex = -1;
  private saTargetLeftPx = 16;
  private saTargetTopPx = 120;
  private saLastWalkTs = 0;
  private saGuideSteps: string[] = [];
  private saPauseUntilTs = 0;
  private saTalkingUntilTs = 0;
  private saDraggingPointerId: number | null = null;
  private saDragOffsetX = 0;
  private saDragOffsetY = 0;
  private saDragStartX = 0;
  private saDragStartY = 0;
  private saDragMoved = false;
  private saSuppressClickUntilTs = 0;

  private readonly onSaPointerMove = (event: PointerEvent) => {
    if (!this.saDragging || this.saDraggingPointerId !== event.pointerId || typeof window === 'undefined') {
      return;
    }

    event.preventDefault();
    this.pauseSaWalk(1000);

    const moveX = Math.abs(event.clientX - this.saDragStartX);
    const moveY = Math.abs(event.clientY - this.saDragStartY);
    if (moveX + moveY > 3) {
      this.saDragMoved = true;
    }

    const nextLeft = event.clientX - this.saDragOffsetX;
    const nextTop = event.clientY - this.saDragOffsetY;
    const clamped = this.clampSaPosition(nextLeft, nextTop);
    this.saFacing = clamped.left >= this.saLeftPx ? 'right' : 'left';
    this.saLeftPx = clamped.left;
    this.saTopPx = clamped.top;
    this.saTargetLeftPx = clamped.left;
    this.saTargetTopPx = clamped.top;
  };

  private readonly onSaPointerUp = (event: PointerEvent) => {
    if (this.saDraggingPointerId !== event.pointerId) {
      return;
    }

    this.saDragging = false;
    this.saDraggingPointerId = null;
    this.pauseSaWalk(1000);

    if (this.saDragMoved) {
      this.saSuppressClickUntilTs = this.getNowTs() + 250;
    }
    this.saDragMoved = false;
    this.detachSaDragListeners();
  };

  private readonly onSaVisibilityChange = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      this.ensureSaRobotRunning();
      this.triggerSaMessage();
    }
  };

  private readonly onSaWindowFocus = () => {
    this.ensureSaRobotRunning();
    this.triggerSaMessage();
  };

  protected get totalCount(): number {
    return this.places.length;
  }

  protected get visitedCount(): number {
    return this.places.filter((p) => p.status === 'visited').length;
  }

  protected get todoCount(): number {
    return this.totalCount - this.visitedCount;
  }

  protected get filteredPlaces(): MissionPlace[] {
    const q = this.searchTerm.trim().toLowerCase();
    return this.places
      .filter((p) => (this.filter === 'all' ? true : p.status === this.filter))
      .filter((p) => `${p.name} ${p.note}`.toLowerCase().includes(q))
      .sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === 'visited' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
  }

  async ngAfterViewInit(): Promise<void> {
    this.initializeTutorial();
    this.restorePlacesState();
    await this.ensureLeafletLoaded();
    this.initMap();
    await this.bootPlaces();
    this.startSaRobot();
  }

  ngOnDestroy(): void {
    if (this.saMessageTimerId) {
      clearInterval(this.saMessageTimerId);
    }
    if (this.saWatchdogId) {
      clearInterval(this.saWatchdogId);
    }
    if (this.saWalkFrameId && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.saWalkFrameId);
      this.saWalkFrameId = undefined;
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onSaVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', this.onSaWindowFocus);
    }
    this.detachSaDragListeners();
    if (this.previewMarker && this.map) {
      this.map.removeLayer(this.previewMarker);
    }
    if (this.map) {
      this.map.remove();
    }
  }

  protected setFilter(value: 'all' | PlaceStatus): void {
    this.filter = value;
    this.syncMarkers();
  }

  protected onSearch(value: string): void {
    this.searchTerm = value;
    this.syncMarkers();
  }

  protected toggleGoalList(): void {
    this.showGoalList = !this.showGoalList;
  }

  protected closeGoalList(): void {
    this.showGoalList = false;
  }

  protected onViewPresetChange(value: string): void {
    if (!this.map) {
      return;
    }

    const safeValue = (value || 'all') as 'all' | 'angkor' | 'phnom-penh' | 'coast' | 'northeast';
    this.viewPreset = safeValue;

    if (safeValue === 'all') {
      this.fitAll();
      return;
    }

    const boundsByPreset: Record<'angkor' | 'phnom-penh' | 'coast' | 'northeast', any> = {
      angkor: this.L.latLngBounds([13.1, 103.7], [13.9, 104.2]),
      'phnom-penh': this.L.latLngBounds([11.3, 104.7], [11.8, 105.1]),
      coast: this.L.latLngBounds([10.2, 102.9], [10.9, 104.4]),
      northeast: this.L.latLngBounds([12.2, 105.7], [14.3, 107.6]),
    };

    this.map.fitBounds(boundsByPreset[safeValue].pad(0.08));
  }

  protected async onGoalSearch(value: string): Promise<void> {
    this.goalSearchTerm = value;
    this.searchTerm = value;
    this.syncMarkers();
    const term = value.trim();
    this.goalSearchAttempted = term.length > 0;
    if (!term) {
      this.goalSuggestions = [];
      this.loadingGoalSuggestions = false;
      return;
    }

    const aliasMatches = this.findAliasSuggestions(term);
    const localMatches = this.findLocalGoalSuggestions(term);
    const seedMatches = this.mergeUniqueSuggestions([...aliasMatches, ...localMatches]);
    this.goalSuggestions = this.sortAndLimitSuggestions(term, seedMatches, 12);

    const normalizedLength = this.normalizeText(term).replace(/\s+/g, '').length;
    const minChars = this.containsKhmer(term) ? 1 : 2;
    if (normalizedLength < minChars) {
      this.loadingGoalSuggestions = false;
      return;
    }

    const seq = ++this.goalSearchSeq;
    this.loadingGoalSuggestions = true;

    // Debounce fast typing to avoid API throttling and improve suggestion quality.
    await this.sleep(220);
    if (seq !== this.goalSearchSeq) {
      return;
    }

    if (this.goalSearchAbort) {
      this.goalSearchAbort.abort();
    }
    this.goalSearchAbort = new AbortController();
    const signal = this.goalSearchAbort.signal;

    try {
      const remoteSuggestions = await this.searchGoalSuggestions(term, signal);
      if (seq !== this.goalSearchSeq) {
        return;
      }

      const merged = this.mergeUniqueSuggestions([...seedMatches, ...remoteSuggestions]);
      let sorted = this.sortAndLimitSuggestions(term, merged, 30);

      // Hard fallback: if list is still empty, do one direct geocode and show it.
      if (!sorted.length) {
        const one = await this.safeSingleSuggestion(term);
        if (one) {
          sorted = [one];
        }
      }

      this.goalSuggestions = sorted;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return;
      }
      if (seq !== this.goalSearchSeq) {
        return;
      }
      let sorted = this.sortAndLimitSuggestions(term, seedMatches, 12);
      if (!sorted.length) {
        const one = await this.safeSingleSuggestion(term);
        if (one) {
          sorted = [one];
        }
      }
      this.goalSuggestions = sorted;
    } finally {
      if (seq === this.goalSearchSeq) {
        this.loadingGoalSuggestions = false;
      }
    }
  }

  protected async chooseGoalSuggestion(item: GoalSuggestion): Promise<void> {
    if (!this.map) {
      return;
    }

    this.goalSearchTerm = item.query;
    this.goalSuggestions = [];
    this.loadingGoalSuggestions = false;
    this.previewSuggestion = item;

    this.map.flyTo([item.lat, item.lng], Math.max(this.map.getZoom(), 10), { duration: 0.9 });
    this.showPreviewMarker(item);
  }

  protected async addGoalFromSearch(): Promise<void> {
    const query = this.goalSearchTerm.trim();
    if (!query || !this.map || this.addingGoal) {
      return;
    }

    this.addingGoal = true;
    try {
      const result = await this.geocodeWithName(query);
      const suggestion: GoalSuggestion = {
        name: result.name || query,
        query,
        lat: result.lat,
        lng: result.lng,
      };
      await this.addGoalFromSuggestion(suggestion);
      this.goalSearchTerm = '';
      this.goalSuggestions = [];
    } catch (error) {
      this.toast((error as Error).message || 'Could not add that place');
    } finally {
      this.addingGoal = false;
    }
  }

  protected flyToPlace(place: MissionPlace): void {
    if (!this.map || typeof place.lat !== 'number' || typeof place.lng !== 'number') {
      return;
    }
    this.map.flyTo([place.lat, place.lng], Math.max(this.map.getZoom(), 10), { duration: 0.9 });
    const marker = this.markerMap.get(place.id);
    if (marker) {
      marker.openPopup();
    }
  }

  protected selectGoalFromList(place: MissionPlace): void {
    this.flyToPlace(place);
    this.showGoalList = false;
  }

  protected fitAll(): void {
    const visible = this.filteredPlaces.filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number');
    if (!visible.length) {
      this.map.fitBounds(this.cambodiaBounds().pad(0.08));
      return;
    }
    const bounds = this.L.latLngBounds(visible.map((p) => [p.lat, p.lng]));
    this.map.fitBounds(bounds.pad(0.15));
  }

  protected async exportJson(): Promise<void> {
    const payload = JSON.stringify(this.places, null, 2);
    try {
      await navigator.clipboard.writeText(payload);
      this.toast('Copied places JSON to clipboard');
    } catch {
      this.toast('Clipboard blocked. Copy from browser prompt.');
      window.prompt('Copy JSON', payload);
    }
  }

  protected importJson(): void {
    const pasted = window.prompt('Paste places JSON');
    if (!pasted) {
      return;
    }

    try {
      const parsed = JSON.parse(pasted);
      if (!Array.isArray(parsed)) {
        throw new Error('Expected an array.');
      }

      this.places = parsed.map((p: any) => ({
        id: Number(p.id),
        name: String(p.name),
        query: String(p.query || `${p.name}, Cambodia`),
        status: p.status === 'visited' ? 'visited' : 'todo',
        note: String(p.note || ''),
        lat: typeof p.lat === 'number' ? p.lat : null,
        lng: typeof p.lng === 'number' ? p.lng : null,
        pinned: Boolean(p.pinned) || (typeof p.lat === 'number' && typeof p.lng === 'number'),
      }));

      for (const marker of this.markerMap.values()) {
        this.map.removeLayer(marker);
      }
      this.markerMap.clear();
      void this.bootPlaces();
      this.persistPlacesState();
      this.toast('Import complete');
    } catch (error) {
      window.alert(`Import failed: ${(error as Error).message}`);
    }
  }

  protected trackById(_: number, p: MissionPlace): number {
    return p.id;
  }

  private async ensureLeafletLoaded(): Promise<void> {
    if (window.L) {
      this.L = window.L;
      return;
    }

    await this.injectLeafletCss();
    await this.injectLeafletScript();
    this.L = window.L;
  }

  private injectLeafletCss(): Promise<void> {
    return new Promise((resolve) => {
      const id = 'leaflet-css';
      if (document.getElementById(id)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.onload = () => resolve();
      document.head.appendChild(link);
    });
  }

  private injectLeafletScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = 'leaflet-js';
      if (document.getElementById(id)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = id;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Leaflet script.'));
      document.body.appendChild(script);
    });
  }

  private initMap(): void {
    const host = this.mapHostRef?.nativeElement;
    if (!host) {
      return;
    }

    this.map = this.L.map(host, {
      zoomControl: true,
      scrollWheelZoom: false,
      touchZoom: true,
      dragging: true,
      doubleClickZoom: false,
      minZoom: 2,
      maxZoom: 19,
    }).setView([12.56, 104.99], 7);

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.L.control.scale({ metric: true, imperial: false }).addTo(this.map);
  }

  private cambodiaBounds(): any {
    return this.L.latLngBounds([9.7, 102.2], [14.8, 107.8]);
  }

  private async bootPlaces(): Promise<void> {
    this.loading = true;
    this.loadingText = 'Locating places...';
    this.map.fitBounds(this.cambodiaBounds().pad(0.08));

    const batchSize = 6;
    for (let i = 0; i < this.places.length; i += batchSize) {
      const batch = this.places.slice(i, i + batchSize);
      await Promise.allSettled(batch.map(async (p) => {
        await this.ensureCoords(p);
        this.createMarkerIfReady(p);
      }));
      this.syncMarkers();
    }

    this.fitAll();
    this.loading = false;
    this.loadingText = '';
  }

  private createMarkerIfReady(place: MissionPlace): void {
    if (this.markerMap.has(place.id)) {
      return;
    }
    if (typeof place.lat !== 'number' || typeof place.lng !== 'number') {
      return;
    }

    const marker = this.L.marker([place.lat, place.lng], {
      icon: this.makeIcon(place.status),
      draggable: true,
      autoPan: true,
    }).addTo(this.map);

    marker.bindPopup(this.popupHtml(place));

    marker.on('dragend', (event: any) => {
      const ll = event.target.getLatLng();
      place.lat = ll.lat;
      place.lng = ll.lng;
      place.pinned = true;
      marker.setPopupContent(this.popupHtml(place));
      this.persistPlacesState();
      this.toast(`Updated: ${place.name}`);
    });

    marker.on('popupopen', (event: any) => {
      const root = event.popup.getElement();
      if (!root) {
        return;
      }
      const toggleButton = root.querySelector(`button[data-place-id="${place.id}"][data-action="toggle"]`) as HTMLButtonElement | null;
      const telegramButton = root.querySelector(`button[data-place-id="${place.id}"][data-action="telegram"]`) as HTMLButtonElement | null;
      if (!toggleButton && !telegramButton) {
        return;
      }

      if (toggleButton) {
        toggleButton.onclick = (clickEvent) => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
          place.status = place.status === 'visited' ? 'todo' : 'visited';
          marker.setIcon(this.makeIcon(place.status));
          marker.setPopupContent(this.popupHtml(place));
          this.syncMarkers();
          this.persistPlacesState();
          marker.openPopup();
        };
      }

      if (telegramButton) {
        telegramButton.onclick = (clickEvent) => {
          clickEvent.preventDefault();
          clickEvent.stopPropagation();
          const typedMessage = window.prompt('Message to send to Telegram:', `${place.name}`);
          if (typedMessage === null) {
            return;
          }
          void this.sendToTelegram(place, typedMessage.trim());
        };
      }
    });

    this.markerMap.set(place.id, marker);
  }

  private syncMarkers(): void {
    for (const place of this.places) {
      const marker = this.markerMap.get(place.id);
      if (!marker) {
        continue;
      }

      const visible = this.filteredPlaces.some((p) => p.id === place.id);
      if (visible && !this.map.hasLayer(marker)) {
        marker.addTo(this.map);
      }
      if (!visible && this.map.hasLayer(marker)) {
        this.map.removeLayer(marker);
      }

      marker.setIcon(this.makeIcon(place.status));
    }
  }

  private makeIcon(status: PlaceStatus): any {
    const color = status === 'visited' ? '#2fe08c' : '#ffcc4d';
    const glow = status === 'visited' ? 'rgba(47,224,140,.35)' : 'rgba(255,204,77,.35)';

    return this.L.divIcon({
      className: 'custom-pin',
      html: `
        <div style="
          width:18px;height:18px;border-radius:50%;
          background:${color};
          box-shadow:0 0 0 6px ${glow},0 10px 18px rgba(0,0,0,.35);
          border:2px solid rgba(255,255,255,.55);
        "></div>
      `,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -10],
    });
  }

  private popupHtml(place: MissionPlace): string {
    const badge = place.status === 'visited' ? 'Visited' : 'Not yet';
    return `
      <div style="min-width:240px">
        <div style="font-weight:800;font-size:14px;margin-bottom:6px">${this.escape(place.name)}</div>
        <div style="font-size:12px;opacity:.9;margin-bottom:10px">${this.escape(place.note)}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-size:12px;opacity:.9">${badge}</span>
          <button data-place-id="${place.id}" data-action="toggle" style="
            cursor:pointer;border:none;padding:7px 10px;border-radius:10px;
            background:rgba(90,228,255,.18);border:1px solid rgba(90,228,255,.35);
            color:#1f355f;font-weight:700;font-size:12px;">Toggle</button>
        </div>
        <div>
          <button data-place-id="${place.id}" data-action="telegram" style="
            width:100%;cursor:pointer;border:none;padding:8px 10px;border-radius:10px;
            background:rgba(95,215,160,.22);border:1px solid rgba(68,191,138,.45);
            color:#1f355f;font-weight:700;font-size:12px;">Brab Pheasa</button>
        </div>
      </div>
    `;
  }

  private async sendToTelegram(place: MissionPlace, customMessage: string): Promise<void> {
    if (typeof place.lat !== 'number' || typeof place.lng !== 'number') {
      this.toast('Location is missing coordinates');
      return;
    }

    const mapsUrl = `https://maps.google.com/?q=${place.lat},${place.lng}`;
    const text = [
      'Message from sokyaBD',
      `Message: ${customMessage || '-'}`,
      `Location: ${place.name}`,
      `Map: ${mapsUrl}`,
    ].join('\n');

    try {
      const response = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          customMessage: customMessage || '-',
          name: place.name,
          lat: place.lat,
          lng: place.lng,
          mapUrl: mapsUrl,
        }),
      });

      if (response.ok) {
        this.toast('Message sent to Phea Sa');
        return;
      }

      let serverError = 'Telegram send failed';
      try {
        const payload = await response.json();
        if (payload?.error) {
          serverError = String(payload.error);
        }
      } catch {
        // Ignore parse issues and use default message.
      }

      // ng serve can return 404 because server.ts routes are not mounted there.
      if (response.status === 404 || response.status === 503) {
        const sent = await this.sendTelegramDirect(text);
        if (sent) {
          this.toast('Message sent to Phea Sa');
          return;
        }
      }

      this.toast(serverError);
      return;
    } catch {
      const sent = await this.sendTelegramDirect(text);
      if (sent) {
        this.toast('Message sent to Phea Sa');
        return;
      }
    }

    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(mapsUrl)}&text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    this.toast('Opening Telegram share');
  }

  private async sendTelegramDirect(text: string): Promise<boolean> {
    if (!this.telegramBotToken || !this.telegramChatId) {
      return false;
    }

    const baseUrl = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
    const query = new URLSearchParams({
      chat_id: this.telegramChatId,
      text,
    }).toString();

    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.telegramChatId,
          text,
        }),
      });

      return response.ok;
    } catch {
      // Some static hosts block reading cross-origin responses; fall through.
    }

    try {
      // Use a simple request that can still be sent on static hosting.
      await fetch(`${baseUrl}?${query}`, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
      });
      return true;
    } catch {
      // Ignore and try final beacon fallback.
    }

    try {
      // Final fallback: fire-and-forget request via image beacon.
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.src = `${baseUrl}?${query}`;
      return true;
    } catch {
      return false;
    }
  }

  private escape(value: string): string {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  private async ensureCoords(place: MissionPlace): Promise<void> {
    if (place.pinned && typeof place.lat === 'number' && typeof place.lng === 'number') {
      return;
    }

    const cache = this.loadGeoCache();
    const key = place.query.toLowerCase();
    const cached = cache[key];
    if (cached) {
      place.lat = cached.lat;
      place.lng = cached.lng;
      return;
    }

    const ll = await this.geocode(place.query);
    place.lat = ll.lat;
    place.lng = ll.lng;
    cache[key] = ll;
    this.saveGeoCache(cache);
  }

  private loadGeoCache(): Record<string, { lat: number; lng: number }> {
    try {
      return JSON.parse(localStorage.getItem(this.geoCacheKey) || '{}');
    } catch {
      return {};
    }
  }

  private saveGeoCache(cache: Record<string, { lat: number; lng: number }>): void {
    try {
      localStorage.setItem(this.geoCacheKey, JSON.stringify(cache));
    } catch {
      // Ignore localStorage failures.
    }
  }

  private async geocode(query: string): Promise<{ lat: number; lng: number }> {
    const result = await this.geocodeWithName(query);
    return { lat: result.lat, lng: result.lng };
  }

  private async geocodeWithName(query: string): Promise<{ lat: number; lng: number; name: string }> {
    const queries = this.buildSearchVariants(query);
    let top: any | null = null;

    for (const variant of queries) {
      const payload = await this.nominatimSearchRaw(variant, 1, false);
      if (payload.length > 0) {
        top = payload[0];
        break;
      }
    }

    if (!top) {
      throw new Error(`No geocode result for ${query}`);
    }

    const displayName = String(top.display_name || query);
    const shortName = displayName.split(',')[0]?.trim() || query;

    return {
      lat: Number(top.lat),
      lng: Number(top.lon),
      name: shortName,
    };
  }

  private async searchGoalSuggestions(term: string, signal?: AbortSignal): Promise<GoalSuggestion[]> {
    const variants = this.buildSearchVariants(term).slice(0, 4);
    const shortQuery = this.normalizeText(term).length <= 3;

    const nearbyBuckets = await Promise.all(
      variants.map((variant) => this.nominatimSearchRaw(variant, shortQuery ? 24 : 14, true, signal)),
    );

    const fallbackBuckets = await Promise.all(
      variants.map((variant) => this.nominatimSearchRaw(variant, shortQuery ? 14 : 10, false, signal)),
    );

    const poiVariants = this.buildPoiSearchVariants(term);
    const poiBuckets = await Promise.all(
      poiVariants.map((variant) => this.nominatimSearchRaw(variant, 12, true, signal)),
    );

    let buckets = [...nearbyBuckets, ...fallbackBuckets, ...poiBuckets];

    // Fallback for POI/street-like inputs when strict query variants return nothing.
    const tokenized = this.tokenizeSearch(term);
    if (buckets.flat().length === 0 && tokenized.length >= 2) {
      const tokenBuckets = await Promise.all(
        tokenized.slice(0, 3).map((token) => this.nominatimSearchRaw(token, 18, false, signal)),
      );
      buckets = [...buckets, ...tokenBuckets];
    }

    const seen = new Set<string>();
    const queryTokens = this.tokenizeSearch(term);
    const isKhmerQuery = this.containsKhmer(term);
    const suggestions = buckets
      .flat()
      .map((item: any) => {
        const displayName = String(item.display_name || '').trim();
        const name = displayName.split(',')[0]?.trim() || 'Unknown place';
        return {
          name,
          query: displayName || name,
          lat: Number(item.lat),
          lng: Number(item.lon),
        } as GoalSuggestion;
      })
      .filter((item: GoalSuggestion) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
      .filter((item: GoalSuggestion) => {
        if (isKhmerQuery) {
          // Khmer query can still return English labels from providers; avoid dropping valid results.
          return true;
        }
        const full = this.normalizeText(`${item.name} ${item.query}`);
        return this.matchAllTokens(full, queryTokens);
      })
      .filter((item: GoalSuggestion) => {
        const key = this.normalizeText(`${item.name}|${item.query}`);
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });

    // If Nominatim is sparse or throttled, enrich with Photon results for small POIs/streets.
    if (suggestions.length < 12) {
      const photon = await this.searchPhotonSuggestions(term, signal).catch(() => [] as GoalSuggestion[]);
      const merged = this.mergeUniqueSuggestions([...suggestions, ...photon]);
      return merged.slice(0, 30);
    }

    return suggestions.slice(0, 30);
  }

  private async searchPhotonSuggestions(term: string, signal?: AbortSignal): Promise<GoalSuggestion[]> {
    const params = new URLSearchParams();
    params.set('q', term);
    params.set('lang', 'km,en');
    params.set('limit', '24');

    // Bias results to map viewport for nearby small places.
    if (this.map) {
      const bounds = this.map.getBounds?.();
      if (bounds) {
        params.set('lon', String(bounds.getCenter().lng));
        params.set('lat', String(bounds.getCenter().lat));
      }
    }

    const response = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal,
    });

    if (!response.ok) {
      throw new Error('Photon search failed');
    }

    const payload = await response.json();
    const features = Array.isArray(payload?.features) ? payload.features : [];

    return features
      .map((feature: any) => {
        const coords = feature?.geometry?.coordinates;
        const props = feature?.properties || {};
        const lon = Array.isArray(coords) ? Number(coords[0]) : NaN;
        const lat = Array.isArray(coords) ? Number(coords[1]) : NaN;
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          return null;
        }

        const name = String(props.name || props.street || props.city || 'Unknown place').trim();
        const parts = [props.name, props.street, props.district, props.city, props.state, props.country]
          .map((x: any) => String(x || '').trim())
          .filter((x: string) => x.length > 0);

        return {
          name,
          query: parts.join(', ') || name,
          lat,
          lng: lon,
        } as GoalSuggestion;
      })
      .filter((x: GoalSuggestion | null): x is GoalSuggestion => Boolean(x));
  }

  private buildPoiSearchVariants(term: string): string[] {
    const q = term.trim();
    if (!q) {
      return [];
    }

    const lower = this.normalizeText(q);
    const variants = new Set<string>([q]);

    // Boost discovery for small POI names (market/shop/store/etc.) around current map view.
    if (!lower.includes('market')) {
      variants.add(`${q} market`);
    }
    if (!lower.includes('shop')) {
      variants.add(`${q} shop`);
    }
    if (!lower.includes('store')) {
      variants.add(`${q} store`);
    }
    if (!lower.includes('street')) {
      variants.add(`${q} street`);
    }
    if (!lower.includes('bridge')) {
      variants.add(`${q} bridge`);
    }
    if (!lower.includes('village')) {
      variants.add(`${q} village`);
    }

    return Array.from(variants).slice(0, 4);
  }

  private buildSearchVariants(term: string): string[] {
    const base = term.trim().replace(/\s+/g, ' ');
    if (!base) {
      return [];
    }

    const seeds = new Set<string>([base]);
    const replacements: Array<[RegExp, string]> = [
      [/\bkos\b/gi, 'koh'],
      [/\bkoas\b/gi, 'koh'],
      [/\bkohh\b/gi, 'koh'],
      [/\bphom\b/gi, 'phnom'],
      [/\bpnom\b/gi, 'phnom'],
      [/\bpichh\b/gi, 'pich'],
      [/\bloeung\b/gi, 'loueng'],
      [/\bloueng\b/gi, 'loeung'],
      [/\brithy\b/gi, 'rethy'],
      [/\brethy\b/gi, 'rithy'],
      [/\bprey\b/gi, 'prei'],
      [/\bprei\b/gi, 'prey'],
      [/\btbong\b/gi, 'tboung'],
      [/\btboung\b/gi, 'tbong'],
      [/\bkhmum\b/gi, 'khmom'],
      [/\bkhmom\b/gi, 'khmum'],
      [/\bchhnang\b/gi, 'chnang'],
      [/\bchnang\b/gi, 'chhnang'],
      [/\bmeanchey\b/gi, 'mean chey'],
      [/\bmean chey\b/gi, 'meanchey'],
    ];

    for (const seed of Array.from(seeds)) {
      for (const [pattern, replacement] of replacements) {
        const next = seed.replace(pattern, replacement).trim();
        if (next) {
          seeds.add(next);
        }
      }
    }

    const variants = Array.from(seeds).flatMap((value) => [
      value,
      `${value}, Cambodia`,
      `${value} Cambodia`,
      `${value}, Phnom Penh, Cambodia`,
    ]);

    return Array.from(new Set(variants.map((v) => v.trim()).filter((v) => v.length > 0)));
  }

  private async nominatimSearchRaw(query: string, limit: number, preferNearby: boolean, signal?: AbortSignal): Promise<any[]> {
    const params = new URLSearchParams();
    params.set('format', 'json');
    params.set('limit', String(limit));
    params.set('addressdetails', '1');
    params.set('accept-language', 'km,en');
    params.set('dedupe', '0');
    params.set('countrycodes', 'kh');
    params.set('q', query);

    if (preferNearby && this.map) {
      const bounds = this.map.getBounds?.();
      if (bounds) {
        const west = bounds.getWest();
        const north = bounds.getNorth();
        const east = bounds.getEast();
        const south = bounds.getSouth();
        params.set('viewbox', `${west},${north},${east},${south}`);
        params.set('bounded', '1');
      }
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      { headers: { Accept: 'application/json' }, signal },
    );

    if (!response.ok) {
      throw new Error('Place search failed');
    }

    const payload = await response.json();
    return Array.isArray(payload) ? payload : [];
  }

  private findLocalGoalSuggestions(term: string): GoalSuggestion[] {
    const q = this.normalizeText(term);
    const tokens = this.tokenizeSearch(term);

    const matched = this.places
      .filter((p) => {
        const hay = this.normalizeText(`${p.name} ${p.note} ${p.query}`);
        if (hay.includes(q)) {
          return true;
        }
        return this.matchAllTokens(hay, tokens);
      })
      .filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number')
      .map((p) => ({
        name: p.name,
        query: p.query,
        lat: p.lat as number,
        lng: p.lng as number,
      }));

    return matched.slice(0, 8);
  }

  private findAliasSuggestions(term: string): GoalSuggestion[] {
    const q = this.normalizeText(term);
    if (!q) {
      return [];
    }

    const aliases: GoalSuggestion[] = [
      {
        name: 'Koh Pich (Diamond Island)',
        query: 'Koh Pich, Phnom Penh, Cambodia',
        lat: 11.5468,
        lng: 104.9386,
      },
      { name: 'Banteay Meanchey', query: 'Banteay Meanchey, Cambodia', lat: 13.7532, lng: 102.9896 },
      { name: 'Phnom Penh', query: 'Phnom Penh, Cambodia', lat: 11.5564, lng: 104.9282 },
      { name: 'Kampong Chhnang', query: 'Kampong Chhnang, Cambodia', lat: 12.2519, lng: 104.6670 },
      { name: 'Kampong Chhnang Province', query: 'Kampong Chhnang Province, Cambodia', lat: 12.2500, lng: 104.6667 },
      { name: 'Kampong Cham', query: 'Kampong Cham, Cambodia', lat: 11.9934, lng: 105.4635 },
      { name: 'Kampong Cham Province', query: 'Kampong Cham Province, Cambodia', lat: 12.0000, lng: 105.4500 },
      { name: 'Kampong Speu', query: 'Kampong Speu, Cambodia', lat: 11.4577, lng: 104.5306 },
      { name: 'Kampong Speu Province', query: 'Kampong Speu Province, Cambodia', lat: 11.4500, lng: 104.5500 },
      { name: 'Kampong Thom', query: 'Kampong Thom, Cambodia', lat: 12.7111, lng: 104.8895 },
      { name: 'Kampong Thom Province', query: 'Kampong Thom Province, Cambodia', lat: 12.7000, lng: 104.9000 },
      { name: 'Battambang', query: 'Battambang, Cambodia', lat: 13.1027, lng: 103.1982 },
      { name: 'Battambang Province', query: 'Battambang Province, Cambodia', lat: 13.0287, lng: 102.9896 },
      { name: 'Kampot', query: 'Kampot, Cambodia', lat: 10.6104, lng: 104.1815 },
      { name: 'Kampot Province', query: 'Kampot Province, Cambodia', lat: 10.7000, lng: 104.2000 },
      { name: 'Kandal Province', query: 'Kandal Province, Cambodia', lat: 11.2237, lng: 105.1259 },
      { name: 'Kep', query: 'Kep, Cambodia', lat: 10.4829, lng: 104.3167 },
      { name: 'Koh Kong', query: 'Koh Kong, Cambodia', lat: 11.6153, lng: 102.9838 },
      { name: 'Koh Kong Province', query: 'Koh Kong Province, Cambodia', lat: 11.6000, lng: 103.0000 },
      { name: 'Kratie', query: 'Kratie, Cambodia', lat: 12.4881, lng: 106.0188 },
      { name: 'Kratie Province', query: 'Kratie Province, Cambodia', lat: 12.5000, lng: 106.0000 },
      { name: 'Mondulkiri', query: 'Mondulkiri, Cambodia', lat: 12.7879, lng: 107.1012 },
      { name: 'Mondulkiri Province', query: 'Mondulkiri Province, Cambodia', lat: 12.8000, lng: 107.1000 },
      { name: 'Ratanakiri', query: 'Ratanakiri, Cambodia', lat: 13.8577, lng: 107.1012 },
      { name: 'Ratanakiri Province', query: 'Ratanakiri Province, Cambodia', lat: 13.9000, lng: 107.1000 },
      { name: 'Pursat', query: 'Pursat, Cambodia', lat: 12.5388, lng: 103.9192 },
      { name: 'Pursat Province', query: 'Pursat Province, Cambodia', lat: 12.5300, lng: 103.9200 },
      { name: 'Preah Sihanouk', query: 'Preah Sihanouk, Cambodia', lat: 10.6277, lng: 103.5225 },
      { name: 'Sihanoukville', query: 'Sihanoukville, Cambodia', lat: 10.6277, lng: 103.5225 },
      { name: 'Preah Vihear', query: 'Preah Vihear, Cambodia', lat: 13.7884, lng: 104.9824 },
      { name: 'Preah Vihear Province', query: 'Preah Vihear Province, Cambodia', lat: 13.7900, lng: 104.9800 },
      { name: 'Prey Veng', query: 'Prey Veng, Cambodia', lat: 11.4868, lng: 105.3253 },
      { name: 'Prey Veng Province', query: 'Prey Veng Province, Cambodia', lat: 11.4868, lng: 105.3253 },
      { name: 'Siem Reap', query: 'Siem Reap, Cambodia', lat: 13.3633, lng: 103.8564 },
      { name: 'Siem Reap Province', query: 'Siem Reap Province, Cambodia', lat: 13.3667, lng: 103.8333 },
      { name: 'Stung Treng', query: 'Stung Treng, Cambodia', lat: 13.5765, lng: 105.9690 },
      { name: 'Stung Treng Province', query: 'Stung Treng Province, Cambodia', lat: 13.5800, lng: 105.9600 },
      { name: 'Svay Rieng', query: 'Svay Rieng, Cambodia', lat: 11.0879, lng: 105.7993 },
      { name: 'Svay Rieng Province', query: 'Svay Rieng Province, Cambodia', lat: 11.0800, lng: 105.7900 },
      { name: 'Takeo', query: 'Takeo, Cambodia', lat: 10.9908, lng: 104.7847 },
      { name: 'Takeo Province', query: 'Takeo Province, Cambodia', lat: 10.9900, lng: 104.7800 },
      { name: 'Oddar Meanchey', query: 'Oddar Meanchey, Cambodia', lat: 14.1602, lng: 103.8216 },
      { name: 'Oddar Meanchey Province', query: 'Oddar Meanchey Province, Cambodia', lat: 14.1600, lng: 103.8200 },
      { name: 'Tbong Khmum', query: 'Tbong Khmum, Cambodia', lat: 11.8836, lng: 105.6582 },
      { name: 'Tbong Khmum Province', query: 'Tbong Khmum Province, Cambodia', lat: 11.8800, lng: 105.6600 },
      { name: 'Pailin', query: 'Pailin, Cambodia', lat: 12.8522, lng: 102.6093 },
      { name: 'Pailin Province', query: 'Pailin Province, Cambodia', lat: 12.8500, lng: 102.6100 },
      { name: 'Baray', query: 'Baray, Prey Veng Province, Cambodia', lat: 11.5491, lng: 105.3859 },
      { name: 'Baray Prasat Theat', query: 'Baray Prasat Theat, Kampong Thom, Cambodia', lat: 13.5121, lng: 104.9380 },
    ];

    const triggers = ['kos pich', 'koh pich', 'koas pich', 'diamond island'];
    const hitKohPich = triggers.some((word) => q.includes(word));

    if (hitKohPich) {
      return aliases.filter((a) => this.normalizeText(a.name).includes('koh pich'));
    }

    const tokens = this.tokenizeSearch(term);
    return aliases.filter((a) => {
      const hay = this.normalizeText(`${a.name} ${a.query}`);
      if (hay.includes(q)) {
        return true;
      }
      return this.matchAllTokens(hay, tokens);
    });
  }

  private mergeUniqueSuggestions(items: GoalSuggestion[]): GoalSuggestion[] {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = this.normalizeText(`${item.name}|${item.query}`);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private normalizeText(value: string): string {
    return String(value)
      .normalize('NFKC')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      // Keep all Unicode letters/numbers so Khmer script remains searchable.
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  }

  private containsKhmer(value: string): boolean {
    return /[\u1780-\u17FF]/.test(String(value));
  }

  private tokenizeSearch(term: string): string[] {
    return this.normalizeText(term)
      .split(' ')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }

  private sortAndLimitSuggestions(term: string, items: GoalSuggestion[], limit: number): GoalSuggestion[] {
    const scored = items
      .map((item) => ({
        item,
        score: this.computeSuggestionScore(term, item),
      }))
      .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));

    return scored.slice(0, limit).map((x) => x.item);
  }

  private computeSuggestionScore(term: string, item: GoalSuggestion): number {
    const q = this.normalizeText(term);
    const tokens = this.tokenizeSearch(term);
    const name = this.normalizeText(item.name);
    const full = this.normalizeText(`${item.name} ${item.query}`);
    let score = 0;

    if (name === q) {
      score += 120;
    }
    if (full === q) {
      score += 110;
    }
    if (name.startsWith(q)) {
      score += 70;
    }
    if (full.startsWith(q)) {
      score += 55;
    }
    if (name.includes(q)) {
      score += 40;
    }
    if (full.includes(q)) {
      score += 30;
    }

    for (const token of tokens) {
      if (name.includes(token)) {
        score += 12;
      } else if (full.includes(token)) {
        score += 7;
      } else if (this.matchAllTokens(full, [token])) {
        score += 5;
      }
    }

    return score;
  }

  private matchAllTokens(hay: string, queryTokens: string[]): boolean {
    if (!queryTokens.length) {
      return true;
    }

    const hayTokens = this.tokenizeSearch(hay);
    if (!hayTokens.length) {
      return false;
    }

    return queryTokens.every((qToken) => hayTokens.some((hToken) => this.tokenMatches(qToken, hToken)));
  }

  private tokenMatches(queryToken: string, hayToken: string): boolean {
    if (!queryToken || !hayToken) {
      return false;
    }

    if (hayToken.includes(queryToken) || queryToken.includes(hayToken)) {
      return true;
    }

    const a = this.canonicalizeToken(queryToken);
    const b = this.canonicalizeToken(hayToken);

    if (!a || !b) {
      return false;
    }

    if (a === b || a.includes(b) || b.includes(a)) {
      return true;
    }

    const dist = this.levenshtein(a, b);
    const threshold = Math.max(1, Math.floor(Math.min(a.length, b.length) / 4));
    return dist <= threshold;
  }

  private canonicalizeToken(token: string): string {
    return token
      .replace(/oeu|oe|ou/g, 'o')
      .replace(/ea|ae|ai|ay/g, 'a')
      .replace(/ee|ei|ey/g, 'e')
      .replace(/kh/g, 'k')
      .replace(/ph/g, 'p')
      .replace(/th/g, 't')
      .replace(/rh/g, 'r')
      .trim();
  }

  private levenshtein(a: string, b: string): number {
    const rows = a.length + 1;
    const cols = b.length + 1;
    const dp: number[][] = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

    for (let i = 0; i < rows; i += 1) {
      dp[i][0] = i;
    }
    for (let j = 0; j < cols; j += 1) {
      dp[0][j] = j;
    }

    for (let i = 1; i < rows; i += 1) {
      for (let j = 1; j < cols; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost,
        );
      }
    }

    return dp[rows - 1][cols - 1];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected closeTutorial(): void {
    this.showTutorial = false;
  }

  protected triggerSaMessage(): void {
    if (this.saGuideActive || this.showSaHelpMenu) {
      return;
    }

    if (this.getNowTs() < this.saTalkingUntilTs) {
      return;
    }

    if (!this.saMessages.length) {
      return;
    }

    let randomIndex = Math.floor(Math.random() * this.saMessages.length);
    if (this.saMessages.length > 1 && randomIndex === this.saLastIndex) {
      randomIndex = (randomIndex + 1) % this.saMessages.length;
    }
    this.saLastIndex = randomIndex;

    this.saCurrentMessage = this.saMessages[randomIndex];
    this.showSaBubble = true;
    this.pauseSaForMessage(this.saCurrentMessage, 1000);
  }

  protected onSaClick(): void {
    if (this.getNowTs() < this.saSuppressClickUntilTs) {
      return;
    }

    this.pauseSaWalk(1000);
    this.triggerSaMessage();
  }

  protected onSaPointerDown(event: PointerEvent): void {
    if (typeof window === 'undefined') {
      return;
    }

    event.preventDefault();
    this.saDragging = true;
    this.saDraggingPointerId = event.pointerId;
    this.saDragOffsetX = event.clientX - this.saLeftPx;
    this.saDragOffsetY = event.clientY - this.saTopPx;
    this.saDragStartX = event.clientX;
    this.saDragStartY = event.clientY;
    this.saDragMoved = false;

    this.pauseSaWalk(1000);
    this.triggerSaHoldMessage();
    this.attachSaDragListeners();
  }

  protected openSaHelpMenu(): void {
    this.showSaHelpMenu = true;
    this.saGuideActive = false;
    this.saGuideSteps = [];
    this.saGuideStepIndex = -1;
    this.saGuideTotalSteps = 0;
    this.saGuideTitle = '';
    this.saCurrentMessage = 'Choose one question. Sa will teach step by step.';
    this.showSaBubble = true;
  }

  protected cancelSaHelpMenu(): void {
    this.showSaHelpMenu = false;
  }

  protected startSaGuide(questionId: string): void {
    const selected = this.saHelpQuestions.find((q) => q.id === questionId);
    if (!selected || !selected.steps.length) {
      return;
    }

    this.showSaHelpMenu = false;
    this.saGuideActive = true;
    this.saGuideTitle = selected.title;
    this.saGuideSteps = [...selected.steps];
    this.saGuideStepIndex = 0;
    this.saGuideTotalSteps = selected.steps.length;
    this.updateSaGuideMessage();
  }

  protected nextSaGuideStep(): void {
    if (!this.saGuideActive) {
      return;
    }

    if (this.saGuideStepIndex + 1 >= this.saGuideSteps.length) {
      this.saCurrentMessage = 'Guide complete. Double click Sa anytime for more help.';
      this.saGuideActive = false;
      this.saGuideSteps = [];
      this.saGuideStepIndex = -1;
      this.saGuideTotalSteps = 0;
      this.saGuideTitle = '';
      this.showSaBubble = true;
      return;
    }

    this.saGuideStepIndex += 1;
    this.updateSaGuideMessage();
  }

  protected closeSaGuide(): void {
    this.saGuideActive = false;
    this.saGuideSteps = [];
    this.saGuideStepIndex = -1;
    this.saGuideTotalSteps = 0;
    this.saGuideTitle = '';
    this.showSaBubble = false;
  }

  private updateSaGuideMessage(): void {
    if (!this.saGuideActive || this.saGuideStepIndex < 0 || this.saGuideStepIndex >= this.saGuideSteps.length) {
      return;
    }

    this.saCurrentMessage = `Step ${this.saGuideStepIndex + 1}/${this.saGuideSteps.length}: ${this.saGuideSteps[this.saGuideStepIndex]}`;
    this.showSaBubble = true;
  }

  private initializeTutorial(): void {
    this.showTutorial = true;
  }

  private startSaRobot(): void {
    this.pickNewSaTarget(true);
    this.triggerSaMessage();

    this.saMessageTimerId = setInterval(() => {
      this.triggerSaMessage();
    }, 7000);

    this.beginSaWalkLoop();

    this.saWatchdogId = setInterval(() => {
      this.ensureSaRobotRunning();
    }, 5000);

    this.setupSaLifecycleListeners();
  }

  private ensureSaRobotRunning(): void {
    if (!this.saMessageTimerId) {
      this.saMessageTimerId = setInterval(() => {
        this.triggerSaMessage();
      }, 7000);
    }
    if (!this.saWalkFrameId) {
      this.beginSaWalkLoop();
    }
    this.showSaBubble = true;
  }

  private setupSaLifecycleListeners(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onSaVisibilityChange);
      document.addEventListener('visibilitychange', this.onSaVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', this.onSaWindowFocus);
      window.addEventListener('focus', this.onSaWindowFocus);
    }
  }

  private pickNewSaTarget(instant = false): void {
    if (typeof window === 'undefined') {
      return;
    }

    const padding = 12;
    const botH = 84;
    const reserveRight = 260; // Keep some room for bubble on right side.
    const maxX = Math.max(padding, window.innerWidth - reserveRight);
    const maxY = Math.max(100, window.innerHeight - botH - padding);

    this.saTargetLeftPx = Math.floor(padding + Math.random() * Math.max(1, maxX - padding));
    this.saTargetTopPx = Math.floor(88 + Math.random() * Math.max(1, maxY - 88));

    if (instant) {
      this.saLeftPx = this.saTargetLeftPx;
      this.saTopPx = this.saTargetTopPx;
    }
  }

  private clampSaPosition(left: number, top: number): { left: number; top: number } {
    if (typeof window === 'undefined') {
      return {
        left: Math.max(8, Math.round(left)),
        top: Math.max(84, Math.round(top)),
      };
    }

    const botW = 72;
    const botH = 90;
    const padding = 8;
    const minTop = 84;
    const maxLeft = Math.max(padding, window.innerWidth - botW - padding);
    const maxTop = Math.max(minTop, window.innerHeight - botH - padding);

    return {
      left: Math.round(Math.min(maxLeft, Math.max(padding, left))),
      top: Math.round(Math.min(maxTop, Math.max(minTop, top))),
    };
  }

  private triggerSaHoldMessage(): void {
    if (!this.saHoldMessages.length) {
      return;
    }

    const index = Math.floor(Math.random() * this.saHoldMessages.length);
    this.saCurrentMessage = this.saHoldMessages[index];
    this.showSaBubble = true;
    // Keep Sa still while this hold message is being spoken.
    this.pauseSaForMessage(this.saCurrentMessage, 1200);
  }

  private attachSaDragListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('pointermove', this.onSaPointerMove);
    window.removeEventListener('pointerup', this.onSaPointerUp);
    window.removeEventListener('pointercancel', this.onSaPointerUp);
    window.addEventListener('pointermove', this.onSaPointerMove, { passive: false });
    window.addEventListener('pointerup', this.onSaPointerUp);
    window.addEventListener('pointercancel', this.onSaPointerUp);
  }

  private detachSaDragListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('pointermove', this.onSaPointerMove);
    window.removeEventListener('pointerup', this.onSaPointerUp);
    window.removeEventListener('pointercancel', this.onSaPointerUp);
  }

  private pauseSaWalk(ms: number): void {
    this.saPauseUntilTs = Math.max(this.saPauseUntilTs, this.getNowTs() + ms);
  }

  private pauseSaForMessage(message: string, minMs: number): void {
    const readingMs = Math.max(minMs, 900 + message.length * 48);
    const untilTs = this.getNowTs() + readingMs;
    this.saTalkingUntilTs = Math.max(this.saTalkingUntilTs, untilTs);
    this.saPauseUntilTs = Math.max(this.saPauseUntilTs, untilTs);
  }

  private getNowTs(): number {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now();
    }
    return Date.now();
  }

  private beginSaWalkLoop(): void {
    if (typeof window === 'undefined') {
      return;
    }

    if (this.saWalkFrameId) {
      window.cancelAnimationFrame(this.saWalkFrameId);
    }

    this.saLastWalkTs = performance.now();

    const speedPxPerSec = 48;
    const step = (ts: number) => {
      const dt = Math.min(0.05, Math.max(0, (ts - this.saLastWalkTs) / 1000));
      this.saLastWalkTs = ts;

      const pauseUntil = Math.max(this.saPauseUntilTs, this.saTalkingUntilTs);
      if (this.saDragging || ts < pauseUntil) {
        this.saWalkFrameId = window.requestAnimationFrame(step);
        return;
      }

      const dx = this.saTargetLeftPx - this.saLeftPx;
      const dy = this.saTargetTopPx - this.saTopPx;
      const dist = Math.hypot(dx, dy);

      if (dist < 2) {
        this.pickNewSaTarget(false);
      } else {
        const move = Math.min(dist, speedPxPerSec * dt);
        const nx = this.saLeftPx + (dx / dist) * move;
        const ny = this.saTopPx + (dy / dist) * move;
        this.saFacing = nx >= this.saLeftPx ? 'right' : 'left';
        this.saLeftPx = Math.round(nx);
        this.saTopPx = Math.round(ny);
      }

      this.saWalkFrameId = window.requestAnimationFrame(step);
    };

    this.saWalkFrameId = window.requestAnimationFrame(step);
  }

  private async safeSingleSuggestion(term: string): Promise<GoalSuggestion | null> {
    try {
      const geocoded = await this.geocodeWithName(term);
      return {
        name: geocoded.name || term,
        query: term,
        lat: geocoded.lat,
        lng: geocoded.lng,
      };
    } catch {
      return null;
    }
  }

  private showPreviewMarker(item: GoalSuggestion): void {
    if (!this.map) {
      return;
    }

    if (this.previewMarker) {
      this.map.removeLayer(this.previewMarker);
      this.previewMarker = null;
    }

    this.previewMarker = this.L.marker([item.lat, item.lng], {
      icon: this.makeIcon('todo'),
      draggable: false,
      autoPan: true,
    }).addTo(this.map);

    this.previewMarker.bindPopup(`
      <div style="min-width:220px">
        <div style="font-weight:800;font-size:14px;margin-bottom:6px">${this.escape(item.name)}</div>
        <div style="font-size:12px;opacity:.9">Preview place from search. Click this pin to set goal.</div>
      </div>
    `).openPopup();

    this.previewMarker.on('click', async () => {
      if (!this.previewSuggestion) {
        return;
      }

      const suggestion = this.previewSuggestion;
      const shouldAdd = window.confirm(`Set "${suggestion.name}" as goal?`);
      if (shouldAdd) {
        await this.addGoalFromSuggestion(suggestion);
        return;
      }

      this.removePreviewMarker();
      this.toast('Preview pin removed');
    });
  }

  private async addGoalFromSuggestion(item: GoalSuggestion): Promise<void> {
    const existing = this.places.find((p) => p.name.toLowerCase() === item.name.toLowerCase());
    if (existing && typeof existing.lat === 'number' && typeof existing.lng === 'number') {
      this.flyToPlace(existing);
      this.toast(`Already in goals: ${existing.name}`);
      return;
    }

    const nextId = this.places.reduce((max, p) => Math.max(max, p.id), 0) + 1;
    const place: MissionPlace = {
      id: nextId,
      name: item.name,
      query: item.query,
      status: 'todo',
      note: 'Added from search',
      lat: item.lat,
      lng: item.lng,
      pinned: true,
    };

    this.places = [...this.places, place];
    this.createMarkerIfReady(place);
    this.syncMarkers();
    this.persistPlacesState();

    this.map.flyTo([item.lat, item.lng], Math.max(this.map.getZoom(), 10), { duration: 0.9 });
    const marker = this.markerMap.get(place.id);
    if (marker) {
      marker.openPopup();
    }

    if (this.previewMarker) {
      this.removePreviewMarker();
    }

    this.toast(`Added goal: ${place.name}`);
  }

  private removePreviewMarker(): void {
    if (this.previewMarker && this.map) {
      this.map.removeLayer(this.previewMarker);
    }
    this.previewMarker = null;
    this.previewSuggestion = null;
  }

  private restorePlacesState(): void {
    try {
      const raw = localStorage.getItem(this.placesStateKey);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return;
      }

      const restored = parsed.map((p: any) => ({
        id: Number(p.id),
        name: String(p.name),
        query: String(p.query || `${p.name}, Cambodia`),
        status: p.status === 'visited' ? 'visited' : 'todo',
        note: String(p.note || ''),
        lat: typeof p.lat === 'number' ? p.lat : null,
        lng: typeof p.lng === 'number' ? p.lng : null,
        pinned: Boolean(p.pinned) || (typeof p.lat === 'number' && typeof p.lng === 'number'),
      })) as MissionPlace[];

      if (restored.length) {
        this.places = restored;
      }
    } catch {
      // Ignore corrupted local state.
    }
  }

  private persistPlacesState(): void {
    try {
      localStorage.setItem(this.placesStateKey, JSON.stringify(this.places));
    } catch {
      // Ignore localStorage failures.
    }
  }

  private toast(message: string): void {
    const el = document.createElement('div');
    el.textContent = message;
    el.style.position = 'fixed';
    el.style.left = '50%';
    el.style.bottom = '18px';
    el.style.transform = 'translateX(-50%)';
    el.style.background = 'rgba(12,23,48,.92)';
    el.style.border = '1px solid rgba(255,255,255,.14)';
    el.style.color = '#eaf0ff';
    el.style.padding = '10px 12px';
    el.style.borderRadius = '14px';
    el.style.zIndex = '9999';
    document.body.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 1200);
  }
}
