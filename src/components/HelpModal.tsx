import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Fragment } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-lg bg-primary text-text-dark p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-2xl font-semibold">
                    OnlyWorlds Browse Tool Guide
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-md p-2 hover:bg-primary-dark transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-6 text-sm leading-relaxed max-h-[70vh] overflow-y-auto pr-2">
                  {/* Overview */}
                  <section>
                    <h3 className="text-lg font-semibold mb-2">Overview</h3>
                    <p className="text-text-dark/80">
                      The Browse Tool is a viewer and editor for OnlyWorlds. It offers functionality for 
                      1. viewing world elements and their relations
                      2. writing (larger) texts for elements, particularly for narratives and events
                      3. publishing individual elements to public showcase URLs
                    </p>
                    <div className="mt-3 space-y-2 text-text-dark/80">
                      <p><strong>Left Sidebar:</strong> Select elements</p>
                      <p><strong>Center Panel:</strong> Element view with various modes</p>
                      <p><strong>Right Panel:</strong> Field editing and reverse relation insights</p> 
                    </div>
                  </section>

                  {/* Element Editing */}
                  <section>
                    <h3 className="text-lg font-semibold mb-2">Edit Mode</h3>
                    <div className="space-y-3 text-text-dark/80">
                      <div> 
                        <p className="text-xs ml-4">
                          Default mode for viewing and editing elements. 
                          Click any field to modify it using right panel.  
                        </p>
                      </div>
                      <div> 
                   
                      </div>
                      <div> 
                        <p className="text-xs ml-4">
                          Save individual fields with the Save button in the edit panel, or use Ctrl+S to save all changes at once. 
                          Press Escape to discard unsaved changes.
                        </p>
                      </div>
                      <div> 
                        <p className="text-xs ml-4">
                          Links to the element are shown in right panelwhen no field is selected. View which other elements reference the current element. For example, see all Characters who list this Location as their birthplace.
                        </p>
                      </div>
                    </div>
                  </section>

                  {/* Showcase Mode */}
                  <section>
                    <h3 className="text-lg font-semibold mb-2">Showcase Mode</h3>
                    <div className="space-y-3 text-text-dark/80">
                      <p className="text-xs">
                        Share read-only views of your elements with others using showcase URLs. No authentication required for viewers.
                      </p>
                      <div>
                        <p className="text-xs ml-4">
                          Click the Share button on any element to generate a public showcase URL.  
                          Showcases pages can be customized to include specific fields. 
                          One showcase can be created per element, and newer versions override older ones. 
                        </p>
                      </div>
                      <div>
              
                      </div>
                    </div>
                  </section>

                  {/* Graph Mode */}
                  <section>
                    <h3 className="text-lg font-semibold mb-2">Network Graph</h3>
                    <div className="space-y-3 text-text-dark/80">
                      <p className="text-xs">
                        View relationships between elements in an interactive 2D or 3D graph.
                      </p>
                      <div> 
                        <ul className="text-xs ml-4 space-y-1">
                          <li>• <strong>Depth (1-5):</strong> Control how many relationship layers to display</li>
                          <li>• <strong>Drag nodes:</strong> Reposition elements</li>
                          <li>• <strong>Click nodes:</strong> Navigate to that element</li>
                          <li>• <strong>Zoom:</strong> Scroll to zoom in/out</li>
                          <li>• <strong>Pan:</strong> Right / middle click and drag</li>
                        </ul>
                      </div>
                
            
                    </div>
                  </section>

                  {/* Story Writing Mode */}
                  <section>
                    <h3 className="text-lg font-semibold mb-2">Story Writing Tools</h3>
                    <div className="space-y-3 text-text-dark/80">
                      <div>
                      // pls write this concise, more like a story (no bullet points, and combine for both narrative and event,
                      the   functionality is msotly hte same for both )
          
                      </div>
              
                      <div>
                        <h4 className="font-medium mb-1">Auto-Link Detection</h4>
                        <p className="text-xs ml-4">
                          The editor scans your text for element names and offers to link them. Accept suggestions 
                          with Tab or click, or ignore to keep as plain text. Toggle highlight visibility as needed.
                        </p>
                      </div>
                    </div>
                  </section>

          

                  {/* About OnlyWorlds */}
                  <section className="border-t border-primary-dark pt-4">
                    <h3 className="text-lg font-semibold mb-2">About OnlyWorlds</h3>
                    <p className="text-text-dark/80 text-xs">
                      OnlyWorlds is an open standard for portable world-building data. Your worlds can flow between different tools 
                      and applications. Visit <a href="https://onlyworlds.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">onlyworlds.com</a> to 
                      learn more.
                    </p>
                  </section>
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-accent hover:bg-accent-hover text-text-dark rounded text-sm transition-colors"
                  >
                    Got it!
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}