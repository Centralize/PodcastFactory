import { AudioClip } from '../../types/project';

export class AudioMixer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audioTracks: AudioClip[] = [];
  private audioContext: AudioContext;
  private isPlaying: boolean = false;
  private selectedTrackId: string | null = null;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private dragTrackId: string | null = null;
  private contextMenu: HTMLElement | null = null;
  private scrollX: number = 0;
  private maxScrollX: number = 0;
  private scrollY: number = 0;
  private maxScrollY: number = 0;
  private timelineWidth: number = 300; // Total timeline duration in seconds
  private zoomLevel: number = 1;
  private scrollContainer: HTMLElement | null = null;
  private maxTracks: number = 12;
  private trackHeight: number = 60;
  private trackSpacing: number = 10;
  private timelineHeight: number = 30;

  constructor() {
    this.canvas = document.getElementById('timeline-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    this.setupScrollContainer();
    this.setupEventListeners();
    this.createContextMenu();
    this.updateScrollLimits();
    this.draw();
  }

  private setupEventListeners(): void {
    document.getElementById('add-audio')?.addEventListener('click', () => {
      this.addAudioFile();
    });

    document.getElementById('play-preview')?.addEventListener('click', () => {
      this.playPreview();
    });

    document.getElementById('stop-preview')?.addEventListener('click', () => {
      this.stopPreview();
    });

    document.getElementById('export-audio')?.addEventListener('click', () => {
      this.exportAudio();
    });

    this.canvas.addEventListener('click', (e) => {
      this.handleCanvasClick(e);
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.handleRightClick(e);
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.handleMouseDown(e);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this.handleMouseMove(e);
    });

    this.canvas.addEventListener('mouseup', (e) => {
      this.handleMouseUp(e);
    });

    this.canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    this.canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      this.handleFileDrop(e);
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.handleWheel(e);
    });

    document.addEventListener('click', (e) => {
      this.hideContextMenu();
    });

    document.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });
  }

  private addAudioFile(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.multiple = true;
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        Array.from(files).forEach(file => {
          this.loadAudioFile(file);
        });
      }
    };
    
    input.click();
  }

  private async loadAudioFile(file: File): Promise<void> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      const trackIndex = this.getAvailableTrackIndex();
      const audioClip: AudioClip = {
        id: Date.now().toString(),
        filename: file.name,
        duration: audioBuffer.duration,
        filePath: URL.createObjectURL(file),
        startTime: 0,
        endTime: audioBuffer.duration,
        volume: 1.0,
        effects: [],
        trackIndex: trackIndex
      };

      this.audioTracks.push(audioClip);
      this.updateScrollLimits();
      this.draw();
      
      console.log(`Loaded audio: ${file.name} (${audioBuffer.duration.toFixed(2)}s)`);
    } catch (error) {
      console.error('Error loading audio file:', error);
      alert('Error loading audio file. Please try a different format.');
    }
  }

  private handleFileDrop(e: DragEvent): void {
    const files = e.dataTransfer?.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('audio/')) {
          this.loadAudioFile(file);
        }
      });
    }
  }

  private handleCanvasClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const clickedTrack = this.getTrackAtPosition(x, y);
    
    if (clickedTrack) {
      this.selectedTrackId = clickedTrack.id;
      console.log(`Selected track: ${clickedTrack.filename}`);
    } else {
      this.selectedTrackId = null;
    }
    
    this.draw();
  }

  private handleRightClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const clickedTrack = this.getTrackAtPosition(x, y);
    
    if (clickedTrack) {
      this.selectedTrackId = clickedTrack.id;
      this.showContextMenu(e.clientX, e.clientY, clickedTrack);
      this.draw();
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    if (e.button !== 0) return; // Only handle left mouse button
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const clickedTrack = this.getTrackAtPosition(x, y);
    
    if (clickedTrack) {
      this.isDragging = true;
      this.dragStartX = x;
      this.dragStartY = y;
      this.dragTrackId = clickedTrack.id;
      this.selectedTrackId = clickedTrack.id;
      this.canvas.style.cursor = 'grabbing';
      this.draw();
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (this.isDragging && this.dragTrackId) {
      const deltaX = x - this.dragStartX;
      const track = this.audioTracks.find(t => t.id === this.dragTrackId);
      
      if (track) {
        const timePerPixel = this.getTimePerPixel();
        const deltaTime = deltaX * timePerPixel;
        
        const newStartTime = Math.max(0, track.startTime + deltaTime);
        const duration = track.endTime - track.startTime;
        
        track.startTime = newStartTime;
        track.endTime = newStartTime + duration;
        
        this.dragStartX = x;
        this.updateScrollLimits();
        this.draw();
      }
    } else {
      const hoveredTrack = this.getTrackAtPosition(x, y);
      this.canvas.style.cursor = hoveredTrack ? 'grab' : 'default';
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.dragTrackId = null;
      this.canvas.style.cursor = 'default';
      console.log('Track repositioned');
    }
  }

  private getTrackAtPosition(x: number, y: number): AudioClip | null {
    for (let i = 0; i < this.audioTracks.length; i++) {
      const track = this.audioTracks[i];
      const trackY = this.getTrackY(track.trackIndex || i) - this.scrollY;
      const trackX = this.timeToPixel(track.startTime) - this.scrollX;
      const trackWidth = this.timeToPixel(track.endTime - track.startTime);
      
      if (x >= trackX && x <= trackX + trackWidth && 
          y >= trackY && y <= trackY + this.trackHeight) {
        return track;
      }
    }
    
    return null;
  }

  private getTrackY(trackIndex: number): number {
    return this.timelineHeight + (trackIndex * (this.trackHeight + this.trackSpacing)) + this.trackSpacing;
  }

  private getAvailableTrackIndex(): number {
    const usedTracks = new Set(this.audioTracks.map(t => t.trackIndex || 0));
    
    for (let i = 0; i < this.maxTracks; i++) {
      if (!usedTracks.has(i)) {
        return i;
      }
    }
    
    return 0; // Fallback to track 0 if all are used
  }

  private draw(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#34495e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawTimeline();
    this.drawAudioTracks();
  }

  private drawTimeline(): void {
    const timelineHeight = 30;
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(0, 0, this.canvas.width, timelineHeight);
    
    this.ctx.strokeStyle = '#7f8c8d';
    this.ctx.lineWidth = 1;
    
    const startTime = this.pixelToTime(this.scrollX);
    const endTime = this.pixelToTime(this.scrollX + this.canvas.width);
    const interval = this.getTimelineInterval();
    
    const startMark = Math.floor(startTime / interval) * interval;
    
    for (let time = startMark; time <= endTime + interval; time += interval) {
      const x = this.timeToPixel(time) - this.scrollX;
      
      if (x >= -50 && x <= this.canvas.width + 50) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, timelineHeight);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`${time.toFixed(1)}s`, x + 2, 20);
      }
    }
  }

  private drawAudioTracks(): void {
    // First draw track backgrounds and labels
    this.drawTrackBackgrounds();
    
    // Then draw audio clips
    this.audioTracks.forEach((track) => {
      const y = this.getTrackY(track.trackIndex || 0) - this.scrollY;
      const x = this.timeToPixel(track.startTime) - this.scrollX;
      const width = this.timeToPixel(track.endTime - track.startTime);
      
      // Skip if track is not visible
      if (y + this.trackHeight < 0 || y > this.canvas.height || 
          x + width < 0 || x > this.canvas.width) {
        return;
      }
      
      const isSelected = track.id === this.selectedTrackId;
      
      this.ctx.fillStyle = isSelected ? '#2ecc71' : '#3498db';
      this.ctx.fillRect(x, y, width, this.trackHeight);
      
      this.ctx.strokeStyle = isSelected ? '#27ae60' : '#2980b9';
      this.ctx.lineWidth = isSelected ? 3 : 2;
      this.ctx.strokeRect(x, y, width, this.trackHeight);
      
      if (isSelected) {
        this.ctx.fillStyle = 'rgba(46, 204, 113, 0.3)';
        this.ctx.fillRect(x - 2, y - 2, width + 4, this.trackHeight + 4);
      }
      
      if (width > 50) {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(track.filename, x + 5, y + 20);
        this.ctx.fillText(`${track.duration.toFixed(1)}s`, x + 5, y + 40);
        
        if (isSelected) {
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = '12px Arial';
          this.ctx.fillText(`Start: ${track.startTime.toFixed(1)}s`, x + 5, y + 55);
        }
      }
    });
  }

  private drawTrackBackgrounds(): void {
    const trackLabelWidth = 80;
    
    for (let i = 0; i < this.maxTracks; i++) {
      const y = this.getTrackY(i) - this.scrollY;
      
      // Skip if track is not visible
      if (y + this.trackHeight < 0 || y > this.canvas.height) {
        continue;
      }
      
      // Draw track background
      this.ctx.fillStyle = i % 2 === 0 ? '#2c3e50' : '#34495e';
      this.ctx.fillRect(0, y, this.canvas.width, this.trackHeight);
      
      // Draw track separator line
      this.ctx.strokeStyle = '#1a252f';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
      
      // Draw track label
      this.ctx.fillStyle = '#7f8c8d';
      this.ctx.font = '12px Arial';
      this.ctx.fillText(`Track ${i + 1}`, 5, y + 15);
      
      // Check if track has audio
      const hasAudio = this.audioTracks.some(track => (track.trackIndex || 0) === i);
      if (hasAudio) {
        this.ctx.fillStyle = '#27ae60';
        this.ctx.fillRect(2, y + 2, 3, this.trackHeight - 4);
      }
    }
  }

  private playPreview(): void {
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    console.log('Playing preview...');
  }

  private stopPreview(): void {
    this.isPlaying = false;
    console.log('Stopped preview');
  }

  private exportAudio(): void {
    if (this.audioTracks.length === 0) {
      alert('No audio tracks to export');
      return;
    }
    
    console.log('Exporting audio...');
    alert('Export functionality will be implemented in the next phase');
  }

  public getAudioTracks(): AudioClip[] {
    return this.audioTracks;
  }

  public clearProject(): void {
    this.audioTracks = [];
    this.selectedTrackId = null;
    this.draw();
  }

  private createContextMenu(): void {
    this.contextMenu = document.createElement('div');
    this.contextMenu.className = 'audio-context-menu';
    this.contextMenu.style.cssText = `
      position: fixed;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: 8px 0;
      z-index: 1000;
      display: none;
      min-width: 150px;
    `;

    const menuItems = [
      { label: 'Delete Track', action: 'delete', icon: '🗑️' },
      { label: 'Duplicate Track', action: 'duplicate', icon: '📋' },
      { label: 'Split Track', action: 'split', icon: '✂️' },
      { label: 'Properties', action: 'properties', icon: '⚙️' }
    ];

    menuItems.forEach(item => {
      const menuItem = document.createElement('div');
      menuItem.className = 'context-menu-item';
      menuItem.innerHTML = `${item.icon} ${item.label}`;
      menuItem.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
      `;

      menuItem.addEventListener('mouseenter', () => {
        menuItem.style.backgroundColor = '#f0f0f0';
      });

      menuItem.addEventListener('mouseleave', () => {
        menuItem.style.backgroundColor = 'transparent';
      });

      menuItem.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleContextMenuAction(item.action);
        this.hideContextMenu();
      });

      this.contextMenu.appendChild(menuItem);
    });

    document.body.appendChild(this.contextMenu);
  }

  private showContextMenu(x: number, y: number, track: AudioClip): void {
    if (!this.contextMenu) return;

    this.contextMenu.style.display = 'block';
    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;

    const rect = this.contextMenu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (rect.right > viewportWidth) {
      this.contextMenu.style.left = `${x - rect.width}px`;
    }

    if (rect.bottom > viewportHeight) {
      this.contextMenu.style.top = `${y - rect.height}px`;
    }
  }

  private hideContextMenu(): void {
    if (this.contextMenu) {
      this.contextMenu.style.display = 'none';
    }
  }

  private handleContextMenuAction(action: string): void {
    const selectedTrack = this.audioTracks.find(t => t.id === this.selectedTrackId);
    if (!selectedTrack) return;

    switch (action) {
      case 'delete':
        this.deleteTrack(selectedTrack.id);
        break;
      case 'duplicate':
        this.duplicateTrack(selectedTrack);
        break;
      case 'split':
        this.splitTrack(selectedTrack);
        break;
      case 'properties':
        this.showTrackProperties(selectedTrack);
        break;
    }
  }

  private deleteTrack(trackId: string): void {
    const index = this.audioTracks.findIndex(t => t.id === trackId);
    if (index !== -1) {
      this.audioTracks.splice(index, 1);
      this.selectedTrackId = null;
      this.draw();
      console.log('Track deleted');
    }
  }

  private duplicateTrack(track: AudioClip): void {
    const newTrackIndex = this.getAvailableTrackIndex();
    const duplicatedTrack: AudioClip = {
      ...track,
      id: Date.now().toString(),
      filename: `${track.filename} (Copy)`,
      startTime: track.startTime,
      endTime: track.endTime,
      trackIndex: newTrackIndex
    };

    this.audioTracks.push(duplicatedTrack);
    this.selectedTrackId = duplicatedTrack.id;
    this.updateScrollLimits();
    this.draw();
    console.log('Track duplicated');
  }

  private splitTrack(track: AudioClip): void {
    const splitPoint = track.startTime + (track.duration / 2);
    const firstHalf: AudioClip = {
      ...track,
      id: Date.now().toString(),
      filename: `${track.filename} (Part 1)`,
      endTime: splitPoint,
      duration: splitPoint - track.startTime
    };

    const newTrackIndex = this.getAvailableTrackIndex();
    const secondHalf: AudioClip = {
      ...track,
      id: (Date.now() + 1).toString(),
      filename: `${track.filename} (Part 2)`,
      startTime: splitPoint,
      duration: track.endTime - splitPoint,
      trackIndex: newTrackIndex
    };

    const index = this.audioTracks.findIndex(t => t.id === track.id);
    this.audioTracks.splice(index, 1, firstHalf, secondHalf);
    this.selectedTrackId = firstHalf.id;
    this.updateScrollLimits();
    this.draw();
    console.log('Track split');
  }

  private showTrackProperties(track: AudioClip): void {
    const properties = `
Track Properties:
- Name: ${track.filename}
- Duration: ${track.duration.toFixed(2)}s
- Start Time: ${track.startTime.toFixed(2)}s
- End Time: ${track.endTime.toFixed(2)}s
- Volume: ${(track.volume * 100).toFixed(0)}%
- Effects: ${track.effects.length}
    `;
    
    alert(properties);
  }

  private setupScrollContainer(): void {
    const timelineContainer = document.getElementById('timeline-container');
    if (timelineContainer) {
      this.scrollContainer = timelineContainer;
    }
  }

  private handleWheel(e: WheelEvent): void {
    if (e.ctrlKey || e.metaKey) {
      this.handleZoom(e);
    } else {
      this.handleScroll(e);
    }
  }

  private handleScroll(e: WheelEvent): void {
    const scrollSpeed = 50;
    
    if (e.shiftKey) {
      // Vertical scrolling with Shift+wheel
      const deltaY = e.deltaY;
      this.scrollY = Math.max(0, Math.min(this.maxScrollY, this.scrollY + deltaY * scrollSpeed / 100));
    } else {
      // Horizontal scrolling
      const deltaX = e.deltaX || e.deltaY;
      this.scrollX = Math.max(0, Math.min(this.maxScrollX, this.scrollX + deltaX * scrollSpeed / 100));
    }
    
    this.draw();
  }

  private handleZoom(e: WheelEvent): void {
    const zoomSpeed = 0.1;
    const oldZoom = this.zoomLevel;
    
    if (e.deltaY < 0) {
      this.zoomLevel = Math.min(5, this.zoomLevel + zoomSpeed);
    } else {
      this.zoomLevel = Math.max(0.1, this.zoomLevel - zoomSpeed);
    }
    
    if (oldZoom !== this.zoomLevel) {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const timeAtMouse = this.pixelToTime(this.scrollX + mouseX);
      
      this.updateScrollLimits();
      
      const newMousePixel = this.timeToPixel(timeAtMouse);
      this.scrollX = Math.max(0, Math.min(this.maxScrollX, newMousePixel - mouseX));
      
      this.draw();
      console.log(`Zoom: ${(this.zoomLevel * 100).toFixed(0)}%`);
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const scrollAmount = 50;
    
    switch (e.key) {
      case 'ArrowLeft':
        this.scrollX = Math.max(0, this.scrollX - scrollAmount);
        this.draw();
        e.preventDefault();
        break;
      case 'ArrowRight':
        this.scrollX = Math.min(this.maxScrollX, this.scrollX + scrollAmount);
        this.draw();
        e.preventDefault();
        break;
      case 'ArrowUp':
        this.scrollY = Math.max(0, this.scrollY - scrollAmount);
        this.draw();
        e.preventDefault();
        break;
      case 'ArrowDown':
        this.scrollY = Math.min(this.maxScrollY, this.scrollY + scrollAmount);
        this.draw();
        e.preventDefault();
        break;
      case 'Home':
        if (e.ctrlKey) {
          this.scrollX = 0;
          this.scrollY = 0;
        } else {
          this.scrollX = 0;
        }
        this.draw();
        e.preventDefault();
        break;
      case 'End':
        if (e.ctrlKey) {
          this.scrollX = this.maxScrollX;
          this.scrollY = this.maxScrollY;
        } else {
          this.scrollX = this.maxScrollX;
        }
        this.draw();
        e.preventDefault();
        break;
    }
  }

  private timeToPixel(time: number): number {
    return (time / this.timelineWidth) * this.canvas.width * this.zoomLevel;
  }

  private pixelToTime(pixel: number): number {
    return (pixel / (this.canvas.width * this.zoomLevel)) * this.timelineWidth;
  }

  private getTimePerPixel(): number {
    return this.timelineWidth / (this.canvas.width * this.zoomLevel);
  }

  private getTimelineInterval(): number {
    const timePerPixel = this.getTimePerPixel();
    const minPixelInterval = 50;
    const minTimeInterval = timePerPixel * minPixelInterval;
    
    const intervals = [0.1, 0.5, 1, 2, 5, 10, 30, 60];
    
    for (const interval of intervals) {
      if (interval >= minTimeInterval) {
        return interval;
      }
    }
    
    return intervals[intervals.length - 1];
  }

  private updateScrollLimits(): void {
    // Horizontal scroll limits
    if (this.audioTracks.length === 0) {
      this.maxScrollX = 0;
    } else {
      const maxEndTime = Math.max(...this.audioTracks.map(t => t.endTime));
      this.timelineWidth = Math.max(300, maxEndTime + 30);
      
      const totalTimelinePixels = this.timeToPixel(this.timelineWidth);
      this.maxScrollX = Math.max(0, totalTimelinePixels - this.canvas.width);
    }
    
    // Vertical scroll limits
    const totalTrackHeight = this.maxTracks * (this.trackHeight + this.trackSpacing) + this.trackSpacing;
    const visibleHeight = this.canvas.height - this.timelineHeight;
    this.maxScrollY = Math.max(0, totalTrackHeight - visibleHeight);
  }

  public zoomIn(): void {
    this.zoomLevel = Math.min(5, this.zoomLevel + 0.2);
    this.updateScrollLimits();
    this.draw();
  }

  public zoomOut(): void {
    this.zoomLevel = Math.max(0.1, this.zoomLevel - 0.2);
    this.updateScrollLimits();
    this.draw();
  }

  public resetZoom(): void {
    this.zoomLevel = 1;
    this.scrollX = 0;
    this.updateScrollLimits();
    this.draw();
  }
}